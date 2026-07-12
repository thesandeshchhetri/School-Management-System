import { csvResponse } from "@/lib/csv";

const TEMPLATE = `Class,Day,Start,End,Subject,Teacher,Room
Grade 8 - Section A,Monday,09:00,09:45,Mathematics,Marcus Lee,Rm 204
Grade 8 - Section A,Monday,10:00,10:45,Science,Marcus Lee,Lab 1
Grade 8 - Section A,Tuesday,09:00,09:45,Mathematics,Marcus Lee,Rm 204
Grade 8 - Section A,Wednesday,10:00,10:45,Science,Marcus Lee,Lab 1
`;

export function GET() {
  return csvResponse("timetable-template.csv", TEMPLATE);
}
