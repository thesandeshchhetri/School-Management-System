import { csvResponse } from "@/lib/csv";

const TEMPLATE = `Subject Name,Code,Class,Teacher
Mathematics,MATH-08,Grade 8 - Section A,Marcus Lee
Science,SCI-08,Grade 8 - Section A,Marcus Lee
English,ENG-08,Grade 8 - Section A,
History,HIST-08,,
`;

export function GET() {
  return csvResponse("subjects-template.csv", TEMPLATE);
}
