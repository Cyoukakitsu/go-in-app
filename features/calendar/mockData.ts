// components/calendar/mockData.ts
import { Bookmark } from './types'

export const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: 'b1',
    university_name: '早稲田大学',
    university_name_zh: '早稻田大学',
    department: '経営学研究科 (Waseda Business)',
    type: '私立',
    status: 'planning',
    schedule: {
      application_start: '2026-06-01',
      application_end: '2026-06-15',
      exam_date: '2026-07-21',
      interview_date: '2026-07-21',
      result_date: '2026-08-10',
    },
  },
  {
    id: 'b2',
    university_name: '慶應義塾大学',
    university_name_zh: '庆应义塾大学',
    department: '商学研究科 (Keio Commerce)',
    type: '私立',
    status: 'applied',
    schedule: {
      application_start: '2026-06-10',
      application_end: '2026-06-20',
      exam_date: '2026-07-10',
      interview_date: null,
      result_date: '2026-08-05',
    },
  },
  {
    id: 'b3',
    university_name: '一橋大学',
    university_name_zh: '一桥大学',
    department: '経営管理研究科 (Hitotsubashi Mngmt)',
    type: '国立',
    status: 'planning',
    schedule: {
      application_start: '2026-07-01',
      application_end: '2026-08-15',
      exam_date: '2026-09-10',
      interview_date: '2026-09-20',
      result_date: '2026-10-05',
    },
  },
  {
    id: 'b4',
    university_name: '東京大学',
    university_name_zh: '东京大学',
    department: '工学系研究科',
    type: '国立',
    status: 'planning',
    schedule: {
      application_start: '2026-06-20',
      application_end: '2026-07-10',
      exam_date: '2026-07-21',  // 早稲田と同日 → conflict!
      interview_date: null,
      result_date: '2026-09-01',
    },
  },
]
