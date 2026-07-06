import re

text = "055ID1******2KAIRUFREDRICK - KARANJA1971M0087541212171533-0"

pattern = re.compile(r"(\d{1,4})(ID|PP)(\d\*{4,7}\d)([A-Z\s\-]+?)(\d{4})([MF])(\d+-\d+)")

match = pattern.search(text)
if match:
    print("Order:", match.group(1))
    print("Type:", match.group(2))
    print("ID:", match.group(3))
    print("Name:", match.group(4))
    print("DOB:", match.group(5))
    print("Gender:", match.group(6))
    print("Elec:", match.group(7))
