import collections
import datetime
import decimal
import getpass
import logging
import math
import pdb
import re
import sys
import os

from lmfit import minimize, Parameters
from lmfit.models import LinearModel
##import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import unicodecsv
import vertica_python as vpy

from ltv_data import loadSQL, getGameName, resultIter, setupLTVTables


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger()


def ltvCumSum(collection, days):
    """just np.cumsum wrapped in a generative helper function to avoid unnecessary typing"""
    for day in days:
        yield np.cumsum(collection[:day])[-1]

def prepDailyECPM(sqldict,date_range):
    logger.info('preparing ECPM data from d'.format(d=date_range[2]))
    sqldict['get_ecpm']=re.sub('DAU_END',date_range[2],sqldict['get_ecpm'])
    with vpy.connect(**conn_info) as conn:
       cur = conn.cursor()
       cur.execute(sqldict['get_ecpm'])
       data=pd.DataFrame(resultIter(cur),columns=['date','platform','rev_per_move'])
       data['date'] = pd.to_datetime(data['date'])
       print data
       return data

def prepDataForModel(sqldict,client,sources,country,date_range,game_name):
    """generates input dataset for model
        columns: days_since_install, sourceN_arpdau, sourceN_ret, sourceN_size, ...
    """
    logger.info('preparing {c} data'.format(c=client))
    sqldict['model_dataset_all'] = re.sub('CLIENT',client,sqldict['model_dataset_all'])
    ##sqldict['model_dataset_all'] = re.sub('STARTDATE',date_range[0],sqldict['model_dataset_all'])
    ##sqldict['model_dataset_all'] = re.sub('INSTALL_ENDDATE',date_range[1],sqldict['model_dataset_all'])
    sqldict['model_dataset_all'] = re.sub('DAU_END',date_range[2],sqldict['model_dataset_all'])

    sqldict['model_dataset_publisher'] = re.sub('CLIENT',client,sqldict['model_dataset_publisher'])
    ##sqldict['model_dataset_publisher'] = re.sub('STARTDATE',date_range[0],sqldict['model_dataset_publisher'])
    ##sqldict['model_dataset_publisher'] = re.sub('INSTALL_ENDDATE',date_range[1],sqldict['model_dataset_publisher'])
    sqldict['model_dataset_publisher'] = re.sub('DAU_END',date_range[2],sqldict['model_dataset_publisher'])
    sqldict['model_dataset_publisher'] = re.sub('SOURCES',sources,sqldict['model_dataset_publisher'])

    sqldict['model_dataset_country'] = re.sub('CLIENT',client,sqldict['model_dataset_country'])
    ##sqldict['model_dataset_country'] = re.sub('STARTDATE',date_range[0],sqldict['model_dataset_country'])
    ##sqldict['model_dataset_country'] = re.sub('INSTALL_ENDDATE',date_range[1],sqldict['model_dataset_country'])
    sqldict['model_dataset_country'] = re.sub('DAU_END',date_range[2],sqldict['model_dataset_country'])
    sqldict['model_dataset_country'] = re.sub('COUNTRIES',countries,sqldict['model_dataset_country'])

    sqldict['model_dataset_publisher_country'] = re.sub('CLIENT',client,sqldict['model_dataset_publisher_country'])
    ##sqldict['model_dataset_publisher_country'] = re.sub('STARTDATE',date_range[0],sqldict['model_dataset_publisher_country'])
    ##sqldict['model_dataset_publisher_country'] = re.sub('INSTALL_ENDDATE',date_range[1],sqldict['model_dataset_publisher_country'])
    sqldict['model_dataset_publisher_country'] = re.sub('DAU_END',date_range[2],sqldict['model_dataset_publisher_country'])
    sqldict['model_dataset_publisher_country'] = re.sub('SOURCES',sources,sqldict['model_dataset_publisher_country'])
    sqldict['model_dataset_publisher_country'] = re.sub('COUNTRIES',countries,sqldict['model_dataset_publisher_country'])

    sqldict['get_daily_rev_move'] = re.sub('CLIENT',client,sqldict['get_daily_rev_move'])
    with vpy.connect(**conn_info) as conn:
        cur = conn.cursor()
        cur.execute(sqldict['model_dataset_all'])
        cohort_colnames = ['publisher','country','start_date','date_diff','cohort','user_cnt','moves']
        cohort_df1= pd.DataFrame(cur.fetchall(),columns=cohort_colnames)

        cur.execute(sqldict['model_dataset_publisher'])
        cohort_df2 = pd.DataFrame(resultIter(cur),columns=cohort_colnames)
        cohort_df1=cohort_df1.append(cohort_df2)

        cur.execute(sqldict['model_dataset_publisher_country'])
        cohort_df2 = pd.DataFrame(resultIter(cur),columns=cohort_colnames)
        cohort_df=cohort_df1.append(cohort_df2)
        cohort_df.to_csv("test.csv")

        cur.execute(sqldict['get_daily_rev_move'])
        rev_move= pd.DataFrame(resultIter(cur),columns=['ads_month','platform','gross_rev_move'])

        rev_move['ads_month'] = pd.to_datetime(rev_move['ads_month'],format='%Y-%m')
        df = rev_move.pivot(index='ads_month', columns='platform')
 
        start_date = df.index.min() - pd.DateOffset(day=1)
        end_date = df.index.max() + pd.DateOffset(day=31)
        dates = pd.date_range(start_date, end_date, freq='D')
        dates.name = 'ads_date'
        df = df.reindex(dates, method='ffill')
        df = df.stack('platform')
        df = df.sortlevel(level=1)
        df = df.reset_index()
         
        
        rev_move= pd.DataFrame(df,columns=['ads_date','platform','gross_rev_move'])

        ## get pred_rev based on installation date
        refreshed_day = datetime.date.today()
        daily_rev=[]
        for i in range(0,367):
            tmp_date=pd.to_datetime(refreshed_day+datetime.timedelta(days=i))
            if tmp_date<=rev_move.ads_date.max():
                try:
                    tmp=rev_move[rev_move['ads_date']==tmp_date].values
                    
                    daily_rev.append([i,tmp[0][2]])
                except:
                    pass
            else:
                year = datetime.timedelta(days=365)
                tmp_date=pd.to_datetime(refreshed_day+datetime.timedelta(days=i)-year)
                try:
                    tmp=rev_move[rev_move['ads_date']==tmp_date].values
                    daily_rev.append([i,tmp[0][2]])
                except:
                    pass
        daily_rev=pd.DataFrame(daily_rev,columns=['days_since_install','gross_rev_move'])
        daily_cohorts = pd.DataFrame({'days_since_install':sorted(daily_rev.days_since_install.unique())})
        daily_rev.to_csv('raw_data.csv')
    
    for source in cohort_df.publisher.unique():
        for country in cohort_df.country.unique():
            daily_data = cohort_df[(cohort_df.publisher == source) & (cohort_df.country == country)]
            daily_data['start_date'] = pd.to_datetime(daily_data['start_date'])
            

            date_diff_0 = daily_data[daily_data['date_diff']==0]
            #filtering out the cohort without installation date
            cohorts=date_diff_0.cohort.unique()
            daily_data=daily_data[daily_data['cohort'].isin(cohorts)]

            # get last date_diff for each cohort & make sure each has at least 10 days
            last_day = daily_data.groupby(['cohort','publisher','country']).date_diff.apply(max)
            # filtering out the cohort with less than 10 days of activity
            last_day = last_day[last_day>10]
               
            if  len(last_day)<10 or date_diff_0['user_cnt'].sum()<8000:
                logger.info('sample size is too small for  {c} {s} {o} data to model'.format(c=client,s=source,o=country))
            else:
                logger.info('preparing {c} {s} {o} data for model'.format(c=client,s=source,o=country))
                revret_by_day = collections.defaultdict(list)
                for day in sorted(daily_data['date_diff'].unique()):
                    cohorts = daily_data[daily_data['date_diff']==day].cohort.unique()
                    installs = 0
                    for cohort_num in cohorts:
                        installs += date_diff_0[date_diff_0['cohort']==cohort_num]['user_cnt'].values[0]
                             
                    if installs > 30:
                        dau = sum(daily_data[daily_data['date_diff']==day]['moves'])
                        retention = dau/float(installs)

                        revret_by_day['days_since_install'].append(day)
                        revret_by_day['_'.join(['_'.join([country,source]),'move'])].append(retention)
                        revret_by_day['_'.join(['_'.join([country,source]),'size'])].append(installs)

                revret_by_day = pd.DataFrame(revret_by_day)
                daily_cohorts = pd.merge(daily_cohorts,revret_by_day,how='left',on='days_since_install')

    daily_cohorts = pd.merge(daily_cohorts,daily_rev,how='left',on='days_since_install') 
    model_input = daily_cohorts.set_index('days_since_install',drop=True)
    model_input.to_csv('input.csv'.format(gn=game_name,c=client))
    logger.info('model input data logged to logs/{gn}/{gn}_{c}_input.csv'.format(gn=game_name,c=client))
    return model_input[:-1]




def model(sqldict,input_df,fit_term,client,show_plots=True):
    """Fits move curves over [fit_term] days"""
    s = 7
    days_since_install = input_df.index
    est_rev_move=input_df['gross_rev_move']
    params = collections.defaultdict(dict)
    projections = collections.defaultdict(dict)
    
    for segnum in range(0,(len(input_df.columns)-1),2):
        ret = input_df[input_df.columns[segnum]]
        segname = '_'.join(ret.name.split('_')[0:2])
        logger.info('Modeling move  curves for {s} {c} data on {ft} days of data'.format(s=segname,c=client,ft=fit_term))
        cnt = ret[s:fit_term]
        time = days_since_install[s:fit_term]
        try:
            # fit move    
            lm = LinearModel(missing='drop')
            #regr = linear_model.LinearRegression(fit_intercept=True)
            x = map(math.log,time.values+1)
            y = map(math.log,cnt.values)
            #regr.fit(np.array([np.array([t]) for t in x]),y )
            pars =  lm.make_params(intercept=min(y), slope=0.5)
            out = lm.fit(y, pars, x=x)
            rln_fit_params = out.params
            seg_pars = [rln_fit_params]
            print rln_fit_params
            # LTV projection
            projection_range = range(0,366)
            move_daily_preds = np.exp([rln_fit_params['intercept'] + rln_fit_params['slope'] * math.log(i+1) for i in projection_range])
            #store the observed day1-day7 LTV
            move_daily_preds[0:7]=ret[0:7]
            print est_rev_move

            ltv_daily_preds = np.multiply(move_daily_preds,est_rev_move)

            parsed_seg_pars = collections.defaultdict(dict)
            for fit in seg_pars:
                fit_pars = [(i,j.value) for i,j in fit.items()]
                for parlist in fit_pars:
                    parsed_seg_pars[parlist[0]] = parlist[1]
            params[segname] = parsed_seg_pars
            
            d0_move=move_daily_preds[0]
            d1_move=move_daily_preds[1]
            d2_move=move_daily_preds[2]
            d3_move=move_daily_preds[3]
            d4_move=move_daily_preds[4]
            d5_move=move_daily_preds[5]
            d6_move=move_daily_preds[6]
            
            d7_ltv,d180_ltv,d365_ltv = ltvCumSum(ltv_daily_preds.values,[7+1, 181, 366])
            
            projections[segname] = (segname.split('_')[0],segname.split('_')[1],d0_move,d1_move,d2_move,d3_move,d4_move,d5_move,d6_move,d7_ltv, d180_ltv, d365_ltv)
            
        except:
            logger.info('Fail to fit move  curves for {s} data'.format(s=segname))
	    
    proj_df = pd.DataFrame.from_dict(projections,'index')
    proj_df.columns = ['country','publisher','d0_move','d1_move','d2_move','d3_move','d4_move','d5_move','d6_move','d7_ltv','d180_ltv','d365_ltv']
    
    par_df = pd.DataFrame.from_dict(params,'index')
    refreshed = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    result = proj_df.join(par_df)
    result['source'] = result.index
    result.reset_index(drop=True, inplace=True)
    
    stamp_cols = ['game_id','platform','refreshed']
    stamp = pd.DataFrame(np.array([game_id,client,refreshed]*len(result)).reshape(len(result),3),columns=stamp_cols)
    
    stamped = result.join(stamp)
    
    stamped.to_csv('output.csv'.format(gn=game_name,c=client), index=False)
    logger.info('logged {gn} {c} {s} results in logs/{gn}/{gn}_{c}_output.csv'.format(gn=game_name,c=client,s=sources))

    # logger.info('updating {gn} {c} results in etl_temp.adjust_wwf_ltv_country_out_training'.format(gn=game_name,c=client))

    # # uncomment these lines to clear previous game/client/source results from output table
    # # sqldict['clear_previous_results'] = re.sub('OS',client,sqldict['clear_previous_results'])
    # # sqldict['clear_previous_results'] = re.sub('SOURCES',str(tuple(sources)),sqldict['clear_previous_results'])
    # with vpy.connect(**conn_info) as conn:
    #     cur = conn.cursor()
    #     #cur.execute(sqldict['dropIfExists_output_table'])
    #     cur.execute(sqldict['create_output_table_ifnotexists'])
    #     #cur.execute(sqldict['grant_permissions_output_table'])
    #     # cur.execute(sqldict['clear_previous_results'])

    # querystring = """insert into etl_temp.adjust_wwf_ltv_country_out_training(game_id,platform,publisher,country,d0_move,d1_move,d2_move,d3_move,d4_move,d5_move,d6_move,d7_ltv, d180_ltv, d365_ltv,slope,intercept,refreshed) values(:game_id,:platform,:publisher,:country,:d0_move,:d1_move,:d2_move,:d3_move,:d4_move,:d5_move,:d6_move,:d7_ltv, :d180_ltv, :d365_ltv,:slope,:intercept,:refreshed);"""
    # for row in stamped.iterrows():
    #     mapped_vals = dict(zip(stamped.columns, row[1].tolist()))
    #     with vpy.connect(**conn_info) as conn:
    #         cur = conn.cursor()
    #         cur.execute(querystring, mapped_vals)

    return stamped


if __name__=='__main__':



    # TODO: use all clients & dates if not specified
    game_id = 5002535
    clients = ['ipad']
    date_range = ['07/22/2016','09/22/2016','10/1/2016']
    
 
    sources = "('facebook')"
    
    countries = "('us')"
    cohort_length = 60
    
    game_name = getGameName(game_id,conn_info)

    # model seperately for each client specified
    for client in clients:
        # load sql statements
        sql = loadSQL('moves_adjust_ltv.sql'.format(game_id), game_name, game_id, clients, date_range[0],date_range[1])
        model_input = prepDataForModel(sql, client, sources,countries, date_range, game_name)
        results = model(sql, model_input,cohort_length, client, show_plots=False)
    ##with vpy.connect(**conn_info) as conn:
       ##cur = conn.cursor()
       ##cur.execute('''select queue_export_data('etl_temp', 'etl_temp', 'adjust_wwf_ltv_country_out', 'adjust_wwf_ltv_country_out1', 'overwrite', '', '', 1) ''')
