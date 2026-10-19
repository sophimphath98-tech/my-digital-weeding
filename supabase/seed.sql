insert into public.event (id, groom, bride, event_date, config, text_kh, text_en, sections)
values (
  1,
  'ឈឹម ផានិត',
  'សន លក្ខណា',
  '2026-12-20T17:00:00+07:00',
  '{
    "primaryColor": "#f9af59",
    "textColor": "#B08E4F",
    "guestNameColor": "#364153",
    "fontKh": "Moul",
    "fontBodyKh": "Battambang",
    "fontEn": "Great Vibes",
    "fontSize": 16,
    "borderRadius": 8,
    "coverBackground": "",
    "mainBackground": "",
    "detailsBackground": "",
    "music": "",
    "mapUrl": "https://maps.app.goo.gl/9Wh42r1JEXaL6PXJ9",
    "mapImage": "",
    "qrUsd": "",
    "qrKhr": "",
    "bankName": "ABA",
    "accountName": "",
    "accountNumber": "",
    "gallery": []
  }'::jsonb,
  '{
    "main_title": "សិរីមង្គលអាពាហ៍ពិពាហ៍",
    "subtitle": "សូមគោរពអញ្ជើញ",
    "invitation_title": "យើងខ្ញុំមានកិត្តិយសសូមគោរពអញ្ជើញ",
    "invitation_message": "សម្តេច ទ្រង់ ឯកឧត្តម លោកជំទាវ លោកអ្នកឧកញ៉ា\nអ្នកឧកញ៉ា ឧកញ៉ា លោក លោកស្រី អ្នកនាង កញ្ញា\nព្រមទាំងប្រិយមិត្តអញ្ជើញចូលរួមជាអធិបតី និងជាភ្ញៀវកិត្តិយស ដើម្បីប្រសិទ្ធិពរជ័យសិរីសួស្តី ជ័យមង្គល ក្នុងពិធីអាពាហ៍ពិពាហ៍ កូនប្រុសស្រី របស់យើងខ្ញុំទាំងពីរ។",
    "date_time": "ថ្ងៃអាទិត្យ ទី២០ ខែធ្នូ ឆ្នាំ២០២៦ វេលាម៉ោង ៥:០០ ល្ងាច",
    "location": "មជ្ឈមណ្ឌលអាពាហ៍ពិពាហ៍ សន្និបាត និងពិព័រណ៍ ឌឹព្រីមៀរសែនសុខ (អាគារ A) រាជធានីភ្នំពេញ។",
    "details_title": "របៀបវារៈកម្មវិធី",
    "gratitude_title": "សូមអរគុណ និងសូមអភ័យទោស",
    "gratitude_message": "យើងខ្ញុំទាំងពីរ សូមថ្លែងអំណរគុណ យ៉ាងជ្រាលជ្រៅ ចំពោះវត្តមាន ដ៏ឧត្តុង្គឧត្តមរបស់ សម្តេច ឯកឧត្តម លោកជំទាវ លោកអ្នកឧកញ៉ា ឧកញ៉ា លោក លោកស្រី អ្នកនាង កញ្ញា ដែលបានអញ្ជើញចូលរួមជាកិត្តិយស ក្នុងពិធីសិរីសួស្តីអាពាហ៍ពិពាហ៍ របស់យើងខ្ញុំ។ យើងខ្ញុំសូមការខន្តីអភ័យទោស ដែលពុំបានជូនលិខិតអញ្ជើញដោយផ្ទាល់។"
  }'::jsonb,
  '{
    "main_title": "Wedding Invitation",
    "subtitle": "We cordially invite",
    "invitation_title": "WE ARE HONORED TO INVITE YOU",
    "invitation_message": "Your Excellency, Oknha, Madam, Ladies and Gentlemen, please join us as the presiding officers and guests of honor to bestow blessings on our wedding.",
    "date_time": "Sunday, December 20, 2026 at 5:00 PM",
    "location": "The Premier Center Sen Sok (Building A), Phnom Penh.",
    "details_title": "WEDDING AGENDA",
    "gratitude_title": "OUR GRATITUDE AND APOLOGY",
    "gratitude_message": "We are extremely thankful for H.E., L.C.T., Okhna, ladies and gentlemen for your presence in our upcoming wedding.\nWe would like to apologize if this invitation has not been personally delivered by us."
  }'::jsonb,
  '{"countdown": true, "agenda": true, "gallery": true, "map": true, "rsvp": true, "wishes": true, "gift": true}'::jsonb
)
on conflict (id) do nothing;

with d as (
  insert into public.schedule_day (title, date, sort)
  values ('កម្មវិធីថ្ងៃទីមួយ៖ អាទិត្យ ទី២០ ខែធ្នូ ២០២៦', '2026-12-20', 0)
  returning id
)
insert into public.timeline_item (day_id, time, name, sort)
select d.id, t.time, t.name, t.sort
from d, (values
  ('07:00 AM', 'ហែជំនូន', 0),
  ('08:00 AM', 'កាត់សក់', 1),
  ('12:00 PM', 'ចងដៃ', 2),
  ('05:00 PM', 'ពិសារភោជនាហារ', 3)
) as t(time, name, sort);

insert into public.guest (code, name, group_tag) values ('demo2026', 'Vibol Khan', 'Friends')
on conflict (code) do nothing;
