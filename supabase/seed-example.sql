-- Optional sample configuration for EXISTING public.schools.public_id = 1.
-- Does not create a duplicate school. Safe to rerun for initial booking data.
BEGIN;
WITH s AS (SELECT id FROM public.schools WHERE public_id=1)
INSERT INTO public.booking_types(school_id,name,sort_order)
SELECT s.id,v.name,v.ord FROM s CROSS JOIN (VALUES ('체육시설예약',1),('태블릿예약',2)) v(name,ord)
ON CONFLICT (school_id,name) DO NOTHING;
WITH s AS (SELECT id FROM public.schools WHERE public_id=1),
 t AS (SELECT bt.id,bt.school_id FROM public.booking_types bt JOIN s ON s.id=bt.school_id WHERE bt.name='체육시설예약')
INSERT INTO public.booking_resources(school_id,type_id,name,sort_order)
SELECT t.school_id,t.id,v.name,v.ord FROM t CROSS JOIN (VALUES ('운동장',1),('체육관',2),('6층 강당',3),('4층 튼튼교실',4)) v(name,ord)
ON CONFLICT (school_id,type_id,name) DO NOTHING;
WITH s AS (SELECT id FROM public.schools WHERE public_id=1)
INSERT INTO public.booking_periods(school_id,label,start_time,end_time,sort_order)
SELECT s.id,v.label,v.start_time::time,v.end_time::time,v.ord FROM s CROSS JOIN (VALUES
('1교시','09:00','09:40',1),('2교시','09:50','10:30',2),('3교시','10:40','11:20',3),('4교시','11:30','12:10',4),('5교시','13:00','13:40',5),('6교시','13:50','14:30',6),('7교시','14:40','15:20',7)) v(label,start_time,end_time,ord)
WHERE NOT EXISTS (SELECT 1 FROM public.booking_periods p WHERE p.school_id=s.id AND p.label=v.label);
COMMIT;
