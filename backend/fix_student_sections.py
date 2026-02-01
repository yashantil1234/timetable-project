# import os
# import sys
# sys.path.append(os.path.dirname(os.path.abspath(__file__)))
#
# from app2 import db, User, Section, Department
#
# def fix_student_sections():
#     """Fix student section assignments"""
#     with db.session.begin():
#         # First, ensure sections exist
#         sections_data = [
#             {"name": "A", "year": 1, "dept_name": "Computer Science"},
#             {"name": "B", "year": 1, "dept_name": "Computer Science"},
#             {"name": "A", "year": 2, "dept_name": "Computer Science"},
#             {"name": "B", "year": 2, "dept_name": "Computer Science"},
#             {"name": "A", "year": 3, "dept_name": "Computer Science"},
#             {"name": "B", "year": 3, "dept_name": "Computer Science"},
#         ]
#
#         for section_data in sections_data:
#             dept = Department.query.filter_by(dept_name=section_data["dept_name"]).first()
#             if not dept:
#                 dept = Department(dept_name=section_data["dept_name"])
#                 db.session.add(dept)
#                 db.session.flush()
#
#             section = Section.query.filter_by(
#                 name=section_data["name"],
#                 year=section_data["year"],
#                 dept_id=dept.id
#             ).first()
#
#             if not section:
#                 section = Section(
#                     name=section_data["name"],
#                     year=section_data["year"],
#                     dept_id=dept.id
#                 )
#                 db.session.add(section)
#
#         db.session.commit()
#
#         # Now fix student assignments
#         students = User.query.filter_by(role='student').all()
#         for student in students:
#             if not student.section_id:
#                 # Find the appropriate section
#                 section = Section.query.filter_by(
#                     name=student.section_name or "A",
#                     year=student.year,
#                     dept_id=student.dept_id
#                 ).first()
#
#                 if section:
#                     student.section_id = section.id
#                     print(f"Fixed section for student {student.username}: {section.name} Year {section.year}")
#                 else:
#                     print(f"Could not find section for student {student.username}")
#
#         db.session.commit()
#         print("Student sections fixed!")
#
# if __name__ == "__main__":
#     fix_student_sections()
