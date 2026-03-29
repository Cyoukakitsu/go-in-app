-- Seed Universities
INSERT INTO universities (name_ja, name_zh, type, departments) VALUES
('東京大学', '东京大学', '国立', '["工学系研究科", "理学系研究科", "経済学研究科", "人文社会系研究科"]'::jsonb),
('京都大学', '京都大学', '国立', '["文学研究科", "教育学研究科", "法学研究科", "経済学研究科"]'::jsonb),
('早稲田大学', '早稻田大学', '私立', '["政治学研究科", "経済学研究科", "法学研究科", "文学研究科", "商学研究科"]'::jsonb),
('慶應義塾大学', '庆应义塾大学', '私立', '["文学研究科", "経済学研究科", "法学研究科", "社会学研究科", "商学研究科"]'::jsonb),
('大阪大学', '大阪大学', '国立', '["人文学研究科", "法学研究科", "経済学研究科", "理学研究科"]'::jsonb);

-- Insert sample schedules
-- Note: Assuming UUIDs for universities
DO $$
DECLARE
  utokyo_id UUID;
  ukyoto_id UUID;
  uwaseda_id UUID;
  ukeio_id UUID;
  uosaka_id UUID;
BEGIN
  SELECT id INTO utokyo_id FROM universities WHERE name_ja = '東京大学';
  SELECT id INTO ukyoto_id FROM universities WHERE name_ja = '京都大学';
  SELECT id INTO uwaseda_id FROM universities WHERE name_ja = '早稲田大学';
  SELECT id INTO ukeio_id FROM universities WHERE name_ja = '慶應義塾大学';
  SELECT id INTO uosaka_id FROM universities WHERE name_ja = '大阪大学';

  -- Tokyo Univ Schedules
  INSERT INTO university_schedules (university_id, department, application_start, application_end, exam_date, result_date, year, tags) VALUES
  (utokyo_id, '工学系研究科', '2024-07-01', '2024-07-10', '2024-08-25', '2024-09-10', 2024, '{"工学", "理系"}'),
  (utokyo_id, '経済学研究科', '2024-06-15', '2024-06-25', '2024-08-15', '2024-09-05', 2024, '{"経済", "文系"}');

  -- Kyoto Univ Schedules
  INSERT INTO university_schedules (university_id, department, application_start, application_end, exam_date, result_date, year, tags) VALUES
  (ukyoto_id, '経済学研究科', '2024-07-05', '2024-07-15', '2024-08-20', '2024-09-08', 2024, '{"経済", "文系"}');

  -- Waseda Univ Schedules
  INSERT INTO university_schedules (university_id, department, application_start, application_end, exam_date, result_date, year, tags) VALUES
  (uwaseda_id, '商学研究科', '2024-08-01', '2024-08-10', '2024-09-15', '2024-09-30', 2024, '{"商学", "MBA"}');

  -- Keio Univ Schedules
  INSERT INTO university_schedules (university_id, department, application_start, application_end, exam_date, result_date, year, tags) VALUES
  (ukeio_id, '経済学研究科', '2024-07-20', '2024-07-30', '2024-09-05', '2024-09-20', 2024, '{"経済", "文系"}');
END $$;
