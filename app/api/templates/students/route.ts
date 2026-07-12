import { csvResponse } from "@/lib/csv";

const TEMPLATE = `Admission No,First Name,Last Name,Class,Gender,Date of Birth,Phone,Address
BP-2026-101,John,Smith,Grade 8 - Section A,Male,2012-03-15,555-0101,123 Main St
BP-2026-102,Sarah,Johnson,Grade 8 - Section A,Female,2012-07-22,,
`;

export function GET() {
  return csvResponse("students-template.csv", TEMPLATE);
}
