--model_dataset_all-#-$-
select case when publisher in ('organic','organic') then 'organic' else 'pac' end as source,
       'all' as country, 
       firstdate,
       stat_date-firstdate as date_diff, 
       dense_rank() over (order by firstdate) as cohort,
       count(distinct user_uid) as user_cnt, 
       sum(movenum_daily) as moves  
from etl_temp.adjust_ltv_GAMENAME
where stat_date-firstdate>=0 and firstdate>='STARTDATE' and firstdate<='INSTALL_ENDDATE' and stat_date <= 'DAU_END'
      and publisher not in  ('pmm emails', 'untrusted devices', 'xpromo', 'yahoo gemini', 'zynga') and platform = 'CLIENT' 
group by 1,2,3,4 order by 4,3,2,1;

--model_dataset_publisher-#-$-
select publisher,
       'all' as country,
       firstdate,
       stat_date-firstdate as date_diff, 
       dense_rank() over (order by firstdate) as cohort,
       count(distinct user_uid) as user_cnt, 
       sum(movenum_daily) as moves
from etl_temp.adjust_ltv_GAMENAME
where stat_date-firstdate>=0 and firstdate>='STARTDATE' and firstdate<='INSTALL_ENDDATE' and stat_date <= 'DAU_END'
      and publisher in SOURCES and platform = 'CLIENT' group by 1,2,3,4 order by 4,3,2,1;       

--model_dataset_country-#-$-
select case when publisher in ('organic','org') then 'organic' else 'pac' end as source,
       country,
       firstdate,
       stat_date-firstdate as date_diff, 
       dense_rank() over (order by firstdate) as cohort,
       count(distinct user_uid) as user_cnt, 
       sum(movenum_daily) as moves
from etl_temp.adjust_ltv_GAMENAME
where stat_date-firstdate>=0 and firstdate>='STARTDATE' and firstdate<='INSTALL_ENDDATE' and stat_date <= 'DAU_END'
      and country in COUNTRIES and platform = 'CLIENT' group by 1,2,3,4 order by 4,3,2,1;

--model_dataset_publisher_country-#-$-
select publisher,
       country,
       firstdate,
       stat_date-firstdate as date_diff,
       dense_rank() over (order by firstdate) as cohort,
       count(distinct user_uid) as user_cnt,
       sum(movenum_daily) as moves
from etl_temp.adjust_ltv_GAMENAME
where stat_date-firstdate>=0 and firstdate>='STARTDATE' and firstdate<='INSTALL_ENDDATE' and stat_date <= 'DAU_END'
      and publisher in SOURCES  and country in COUNTRIES and platform = 'CLIENT' group by 1,2,3,4 order by 4,3,2,1;

--dropIfExists_output_table-#-$-
drop table if exists etl_temp.adjust_wwf_ltv_country_out_training cascade;
 
--create_output_table_ifnotexists-#-$-
create table if not exists etl_temp.adjust_wwf_ltv_country_out_training(
    game_id int,
    platform varchar(45),
    country varchar(45),
    publisher varchar(45),
    d0_move float,
    d1_move float,
    d2_move float,
    d3_move float,
    d4_move float,
    d5_move float,
    d6_move float,
    d7_ltv float,
    d180_ltv float,
    d365_ltv float,
    slope float,
    intercept float,
    refreshed datetime)
order by game_id,platform,publisher
segmented by game_id all nodes ksafe 1
;

--grant_permissions_output_table-#-$-
grant select on etl_temp.adjust_wwf_ltv_country_out to analytics_user;

--dropIfExists_ltv_table-#-$-
drop table if exists etl_temp.adjust_ltv_GAMENAME cascade;

--create_ltv_table-#-$- 
create table if not exists etl_temp.adjust_ltv_GAMENAME(
    user_uid varchar(40),
    game_id varchar(10),
    platform varchar(40),
    stat_date date,
    firstdate date,
    publisher varchar(65),
    country varchar(45),
    device_name varchar(65),
    movenum_daily float
)order by user_uid segmented by hash(user_uid) all nodes ksafe 1;

--grant_permissions-#-$-
grant select on etl_temp.adjust_ltv_GAMENAME to public;

--get_dau_all-#-$-
insert /*+direct*/ into etl_temp.tmp_mud_u (metric, game_id, user_uid, date, date2, date3, metric2,metric3)
select  'dau', game_id, hash(adid), created_at::date, created_at, client_device_ts,lower(os_name),
        case when lower(os_name) = 'android' then 'android'
             when lower(os_name) = 'ios' and lower(device_name) like '%ipad%' then 'ipad'
             when lower(os_name) = 'ios' and lower(device_name) like '%iphone%' then 'iphone'
             else 'others' end as platform
from mkt.mkt_mob_adjust_events
where game_id = GAME_ID and lower(event_name) = 'movesplayed' and move_type not in ('declined_invite','game_over','resigned') 
      and move_type is not null and created_at::date between ('STARTDATE'::date-5) and ('INSTALL_ENDDATE'::date+70) 
      and (lower(os_name) = 'android' or (lower(os_name) = 'ios' and (lower(device_name) like '%ipad%' or lower(device_name) like '%iphone%') ));

--get_dau_one-#-$-
insert /*+direct*/ into etl_temp.tmp_mud_u (metric, game_id, metric2, metric3,user_uid, date, date2, date3)
select distinct 'dau_1', game_id, metric2, metric3,user_uid, date, date2, date3
from etl_temp.tmp_mud_u where metric = 'dau';

--get_dau_two-#-$-
insert /*+direct*/ into etl_temp.tmp_mud_u (metric, game_id, metric2,metric3, user_uid, date, value)
select 'dau_2', game_id,  metric2, metric3,user_uid, date, count(date2)
from etl_temp.tmp_mud_u where metric = 'dau_1' group by 1, 2, 3, 4, 5,6;

--get_impression_cnt-#-$-
INSERT /*+direct*/ into etl_temp.tmp_mud(metric,date,metric2,metric3,value2)
select case when platform='Android' and ad_unit in ('Banner','Community Banner','Gameboard Banner','Native','Native Lobby') then'Android_Banner'
            when platform = 'Android' and ad_unit in ('Interstitial', 'Prestitial') then 'Android_Interstitial'
            when platform = 'iPad' and ad_unit in ('Banner','Community Banner','Gameboard Banner','Native','Native Lobby') then 'iPad_Banner'
            when platform = 'iPad' and ad_unit in ('Interstitial', 'Prestitial') then 'iPad_Interstitial'
            when platform = 'iPhone' and ad_unit in ('Banner','Community Banner','Gameboard Banner','Native','Native Lobby') then 'iPhone_Banner'
            when platform = 'iPhone' and ad_unit in ('Interstitial', 'Prestitial')then 'iPhone_Interstitial'
            else 'others' end,
date, lower(platform), 
case when (ad_unit in ('Banner','Community Banner','Gameboard Banner','Native','Native Lobby') or ad_unit is null) then 'Banner' 
     else 'Interstitial' end,
sum(impressions)
from report.r_adrev 
where game_id = GAME_ID  and platform in ('Android','iPhone','iPad')
and ad_unit in ('Banner','Community Banner','Gameboard Banner','Native','Native Lobby','Interstitial', 'Prestitial') and date between ('STARTDATE'::date) and ('STARTDATE'::date+30)
group by 1,2,3,4;


--get_total_num_move_day-#-$-
insert /*+direct*/ into etl_temp.tmp_mud(metric, date, metric2, value)
select 'num_moves', date, metric3, sum(value) 
from etl_temp.tmp_mud_u where date between ('STARTDATE'::date) and ('STARTDATE'::date+30) and metric = 'dau_2'
group by 1, 2, 3
order by 1, 2, 3;

--get_impression_per_move-#-$-
INSERT /*+direct*/ into etl_temp.tmp_mud(metric, metric2, metric3, value_f)
select 'imp_move', a.metric2, a.metric3, 
       case when a.metric2 = 'android' then sum(a.value2)/(sum(b.value)*0.895)
            when a.metric2 = 'ipad' then sum(a.value2)/(sum(b.value)*0.508)
            when a.metric2 = 'iphone' then sum(a.value2)/(sum(b.value)*0.583) end as imp_per_move
from etl_temp.tmp_mud a
join etl_temp.tmp_mud b
on a.date = b.date and a.metric2 = b.metric2 and b.metric = 'num_moves'
where a.metric in ('Android_Banner', 'Android_Interstitial', 'iPad_Banner', 'iPad_Interstitial', 'iPhone_Banner', 'iPhone_Interstitial')
      and a.date  between ('STARTDATE'::date) and ('STARTDATE'::date+30) 
group by 1,2,3;


--merge_cpm_imp-#-$-
insert /*+direct*/ into etl_temp.tmp_mud (metric,date,metric2,metric3,value_f,value_f2)
select 'combine', a.date, a.platform, a.ads_type, a.cpm, b.value_f
from (select b.date,b.platform,b.ads_type,b.cpm from etl_temp.ltv_cpm_new b inner join 
     (select  max(upload_date) as last_update_date from etl_temp.ltv_cpm_new ) c
     on b.upload_date= c.last_update_date) a
left join etl_temp.tmp_mud b
on b.metric= 'imp_move' and lower(a.platform) = b.metric2 and a.ads_type= b.metric3;


--dropIfExists_rev_move_table-#-$-
drop table if exists etl_temp.wwf_rev_per_move cascade;

--create_daily_rev_move-#-$-
create table if not exists etl_temp.wwf_rev_per_move(   
    ads_date date,
    platform varchar(45),
    gross_rev_per_move float
    ) order by ads_date,platform;

--grant_permissions_rev_move-#-$-
grant select on etl_temp.wwf_rev_per_move to public;

--get_insert_rev_move-#-$-
insert /*+direct*/ into etl_temp.wwf_rev_per_move(ads_date,platform,gross_rev_per_move)
select  a.date::date, a.metric2, (a.value_f*a.value_f2+b.value_f*b.value_f2)*0.75/1000 as rev_per_move
from etl_temp.tmp_mud a
join etl_temp.tmp_mud b
on a.date = b.date and a.metric2 = b.metric2 and b.metric3 = 'Banner' and b.metric2 <> 'Kindle' and b.metric = 'combine'
where a.metric3 = 'Interstitial' and a.metric2 <> 'Kindle' and a.metric = 'combine';

--get_daily_rev_move-#-$-
select ads_date, platform, gross_rev_per_move from etl_temp.wwf_rev_per_move where lower(platform)='CLIENT';

--get_install-#-$-
insert /*+direct*/ into etl_temp.tmp_mud_u (metric, game_id, user_uid, date, metric2, metric3, metric4, metric5)
select 'installs',
        game_id, hash(adid),
        min(installed_at::date),
        min(lower(network_name)), min(lower(country)), min(lower(device_name)), min(lower(os_name))
from mkt.mkt_mob_adjust_installs
where game_id = GAME_ID group by 2,3 having min(installed_at::date)>=('STARTDATE'::date-20);


--get_pushlier-#-$-
select platform,
       publisher,
       country, 
       count(user_uid) as install
from etl_temp.adjust_ltv_GAMENAME 
where stat_date=firstdate group by 1,2,3;
;

--get_ltv_data_date0-#-$-
insert /*+ direct */  into etl_temp.adjust_ltv_GAMENAME(user_uid,game_id,platform,stat_date,firstdate,publisher,country,device_name,movenum_daily)
select b.user_uid, b.game_id, 
case when  b.metric5='ios' and lower(b.metric4) like '%iphone%' then 'iphone'
     when  b.metric5='ios' and lower(b.metric4) like '%ipad%' then 'ipad'
     when  b.metric5='android' then 'android' else  'others' end, case when a.date::date is null then b.date::date else a.date::date end, b.date::date, 
     case when b.metric2 in ('facebook installs','off-facebook installs','facebook+installs','off-facebook+installs') then 'facebook' when b.metric2 in ('twitter installs','twitter publisher network') then 'twitter' else b.metric2 end,
     b.metric3, b.metric4, 
     case when a.value is null then 0 else a.value end
from  etl_temp.tmp_mud_u b left join etl_temp.tmp_mud_u a
on a.game_id=b.game_id and a.user_uid=b.user_uid and a.date::date = b.date::date and a.metric = 'dau_2' where b.metric='installs' and b.metric5 in ('ios','android');


--get_ltv_data_date_later-#-$-
insert /*+ direct */  into etl_temp.adjust_ltv_GAMENAME(user_uid,game_id,platform,stat_date,firstdate,publisher,country,device_name,movenum_daily)
select b.user_uid, b.game_id,
case when  b.metric5='ios' and lower(b.metric4) like '%iphone%' then 'iphone'
     when  b.metric5='ios' and lower(b.metric4) like '%ipad%' then 'ipad'
     when  b.metric5='android' then 'android' else  'others' end, case when a.date::date is null then b.date::date else a.date::date end, b.date::date,
     case when b.metric2 in ('facebook installs','off-facebook installs','facebook+installs','off-facebook+installs') then 'facebook' when b.metric2 in ('twitter installs','twitter publisher network') then 'twitter' else b.metric2 end,
     b.metric3, b.metric4,
     a.value
from  etl_temp.tmp_mud_u b inner  join etl_temp.tmp_mud_u a
on a.game_id=b.game_id and a.user_uid=b.user_uid where a.date::date > b.date::date and a.metric = 'dau_2' and  b.metric='installs' and b.metric5 in ('ios','android');
