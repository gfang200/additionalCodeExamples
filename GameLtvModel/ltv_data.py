import collections
import decimal
import getpass
import logging
import os
import pdb
import re
import sys
import mysql.connector
import numpy as np
import pandas as pd
import unicodecsv
import vertica_python as vpy


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger()



pd.options.mode.chained_assignment = None  # default='warn'


def resultIter(cursor,batchsize=1000):
    """an iterator that uses fetchmany to keep memory usage down"""
    while True:
        results = cursor.fetchmany(batchsize)
        if not results:
            break
        for result in results:
            yield result

def loadSQL(filename,game_name,game_id,clients,startdate,enddate):
    """parse sql statements into dict for easy call"""

    sqldict = collections.OrderedDict()

    with open(filename, 'r') as fd:
        statements = fd.read()
    sql_commands = [i.split('-#-$-') for i in statements.split(';')[:-1]]
    
    for command in sql_commands:
        if len(command)==2:
            cmd_name = re.sub('--','',command[0].strip())
            cmd = re.sub('\n',' ',command[1])
            cmd = re.sub('GAMENAME',game_name, cmd)
            cmd = re.sub('GAME_ID',str(game_id),cmd)
            cmd = re.sub('CLIENTS',str(clients),cmd)
            cmd = re.sub('STARTDATE',startdate,cmd)
            cmd = re.sub('INSTALL_ENDDATE',enddate,cmd)
            sqldict[cmd_name] = cmd
        else:
	    pass
    return sqldict

def getGameName(game_id,conn_info):
    with vpy.connect(**conn_info) as conn:
        cur = conn.cursor()
        query = """select game_name from lookups.l_game where game_state='live' and game_id={}""".format(game_id)
        cur.execute(query)
        game_name = cur.fetchall()
    return '_'.join(game_name[0][0].lower().split())

def setupLTVTables(cursor,sql,game_name):
    logger.info('refreshing table etl_temp.adjust_ltv_{}...'.format(game_name))
    cursor.execute(sql['dropIfExists_ltv_table'])
    cursor.execute(sql['create_ltv_table'])
    cursor.execute(sql['grant_permissions'])
    cursor.execute(sql['dropIfExists_rev_move_table'])
    cursor.execute('''drop table if exists etl_temp.wwf_rev_per_move''')
    cursor.execute(sql['create_daily_rev_move'])
    cursor.execute(sql['grant_permissions_rev_move'])

def Dataset(cursor,sql):
    logger.info('fetching move dau data from adjust...')
    cursor.execute(sql['get_dau_all'])
    cursor.execute(sql['get_dau_one'])
    cursor.execute(sql['get_dau_two'])
    cursor.execute(sql['get_install'])
    cursor.execute(sql['get_ltv_data_date0'])
    cursor.execute(sql['get_ltv_data_date_later'])

    logger.info('Generate cpm forecast from adjust...')
    cursor.execute(sql['get_impression_cnt'])
    logger.info('impression is done')
    cursor.execute(sql['get_total_num_move_day'])
    logger.info('move is done')
    cursor.execute(sql['get_impression_per_move'])
    logger.info('imp_per_move is done')
    cursor.execute(''' select metric2,metric3,value_f from etl_temp.tmp_mud where metric='imp_move' ''')
    print 'imp_move',cursor.fetchall()
    cursor.execute(sql['merge_cpm_imp'])
    logger.info('cpm_imp is done')
    cursor.execute(sql['get_insert_rev_move'])
    logger.info('rev_move is done')
    


def createLTVDataset(game_sqldict,startdate,game_id,game_name):
    """generates raw version of user-level LTV dataset"""
    with vpy.connect(**conn_info) as conn:
        cur = conn.cursor()
        setupLTVTables(cur,game_sqldict,game_name)
        Dataset(cur,game_sqldict)
        cur.execute(game_sqldict['get_pushlier'])
        data=pd.DataFrame(cur.fetchall(),columns=['platform','pushlier','country','install_cnt'])
        data=data[data['install_cnt']>5000]
        tmp=data.sort_values(['platform','country','install_cnt'],ascending=[True, True, False])
        tmp.to_csv('/home/hzhou/LTV/ltv_country/ltv_WWF/logs/{gn}/{gn}_publiser.csv'.format(gn=game_name), index=False)
        conn.commit()


if __name__=='__main__':

    #user = raw_input("LDAP: ")
    #_pass_ = getpass.getpass('password: ')

    user='gfang'
    _pass_='P450+bm3'

    conn_info = {'host': 'stats-read.zynga.com',
             'port': 5433,
             'user': user,
             'password': _pass_,
             'database': 'warehouse',
             'read_timeout': 6000}


    # TODO: use all clients & dates if not specified
    game_id = 5002535
    clients = 'ipad'
    startdate = sys.argv[3]
    enddate = sys.argv[4]
    

    game_name = getGameName(game_id,conn_info)

    game_sql = loadSQL('/home/hzhou/LTV/ltv_country/ltv_WWF/sql/adjust_ltv.sql', game_name, game_id, clients, startdate,enddate)
    logger.info('loaded statements from sql/adjust_ltv.sql')
    game_dir = 'logs/{}'.format(game_name)
    if not os.path.exists(game_dir):
        os.makedirs(game_dir)

    # dataset creation
    createLTVDataset(game_sql, startdate, game_id, game_name)
