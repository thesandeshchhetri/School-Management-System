import { csvResponse } from "@/lib/csv";

const TEMPLATE = `Name,Email,Subject,Phone
Jane Doe,jane.doe@school.edu,English,555-0201
Robert Chen,robert.chen@school.edu,Physics,555-0202
`;

export function GET() {
  return csvResponse("teachers-template.csv", TEMPLATE);
}
