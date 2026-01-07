@app.route("/admin/faculty", methods=["GET", "POST", "OPTIONS"])
@token_required
@admin_required
def admin_faculty(current_user):
    if request.method == "GET":
        try:
            faculty = Faculty.query.all()
            return jsonify([
                {
                    "id": f.faculty_id,
                    "name": f.faculty_name,
                    "dept_name": f.department.dept_name if f.department else None,
                    "max_hours": f.max_hours
                } for f in faculty
            ])
        except Exception as e:
            return jsonify({"error": f"Failed to fetch faculty: {str(e)}"}), 500
    else:
        try:
            data = request.json
            if not data or not data.get("faculty_name") or not data.get("dept_name"):
                return jsonify({"error": "Faculty name and department are required"}), 400
            dept = Department.query.filter_by(dept_name=data["dept_name"]).first()
            if not dept:
                return jsonify({"error": "Department not found"}), 404
            if Faculty.query.filter_by(faculty_name=data["faculty_name"].strip()).first():
                return jsonify({"error": "Faculty member already exists"}), 400
            faculty = Faculty(
                faculty_name=data["faculty_name"].strip(),
                max_hours=data.get("max_hours", 12),
                dept_id=dept.id,
                email=data["email"].strip()
            )
            db.session.add(faculty)
            db.session.commit()
            export_csvs()
            return jsonify({"message": "Faculty added successfully!", "faculty_id": faculty.faculty_id})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": f"Failed to add faculty: {str(e)}"}), 500