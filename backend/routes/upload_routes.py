"""
CSV upload routes
"""

import pandas as pd
from flask import Blueprint, request, jsonify
from extensions import db
from models import Department, Section, Faculty, User
from utils.decorators import token_required, admin_required
from utils.export_utils import export_csvs

upload_bp = Blueprint('upload', __name__)


@upload_bp.route("/faculty", methods=["POST", "OPTIONS"])
@token_required
@admin_required
def upload_faculty(current_user):
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400
        df = pd.read_csv(file)
        required_cols = ['faculty_name', 'dept_name']
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            return jsonify({"error": f"CSV must contain columns: {', '.join(missing_cols)}"}), 400
        added = 0
        for _, row in df.iterrows():
            fname = str(row['faculty_name']).strip() if pd.notna(row['faculty_name']) else ""
            dname = str(row['dept_name']).strip() if pd.notna(row['dept_name']) else ""
            if not fname or not dname:
                continue
            if Faculty.query.filter_by(faculty_name=fname).first():
                continue
            dept = Department.query.filter_by(dept_name=dname).first()
            if not dept:
                continue
            faculty = Faculty(
                faculty_name=fname,
                max_hours=int(row.get('max_hours', 12)) if pd.notna(row.get('max_hours')) else 12,
                dept_id=dept.id,
                email=str(row.get('email', '')).strip() if pd.notna(row.get('email')) else None
            )
            db.session.add(faculty)
            added += 1
        db.session.commit()
        export_csvs()
        return jsonify({"message": f"Successfully added {added} faculty members"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/students", methods=["POST", "OPTIONS"])
@token_required
@admin_required
def upload_students(current_user):
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400
        df = pd.read_csv(file)
        required_cols = ['username', 'password', 'dept_name', 'year', 'section_name']
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            return jsonify({"error": f"CSV must contain columns: {', '.join(missing_cols)}"}), 400
        added = 0
        for _, row in df.iterrows():
            username = str(row['username']).strip() if pd.notna(row['username']) else ""
            if not username or User.query.filter_by(username=username).first():
                continue
            dept = Department.query.filter_by(dept_name=str(row['dept_name']).strip()).first()
            if not dept:
                continue
            section = Section.query.filter_by(
                name=str(row['section_name']).strip(),
                year=int(row['year']),
                dept_id=dept.id
            ).first()
            if not section:
                continue
            user = User(
                username=username,
                role='student',
                dept_id=dept.id,
                year=int(row['year']),
                section_id=section.id
            )
            user.set_password(str(row['password']))
            db.session.add(user)
            added += 1
        db.session.commit()
        export_csvs()
        return jsonify({"message": f"Successfully added {added} students"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/departments", methods=["GET", "POST", "OPTIONS"])
@token_required
def upload_departments(current_user):
    if request.method != "POST":
        return jsonify({"message": "Use POST with form-data 'file' (CSV)"}), 200
    if current_user.role != "admin":
        return jsonify({"error": "Unauthorized - admin only"}), 403
    
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400
        
        df = pd.read_csv(file)
        added_count = 0
        for _, row in df.iterrows():
            if not Department.query.filter_by(dept_name=row['dept_name']).first():
                dept = Department(dept_name=row['dept_name'])
                db.session.add(dept)
                added_count += 1
        db.session.commit()
        export_csvs()
        return jsonify({"message": f"Successfully added {added_count} departments"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@upload_bp.route("/sections", methods=["GET", "POST", "OPTIONS"])
@token_required
def upload_sections(current_user):
    if request.method != "POST":
        return jsonify({"message": "Use POST with form-data 'file' (CSV)"}), 200
    if current_user.role != "admin":
        return jsonify({"error": "Unauthorized - admin only"}), 403
    
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No file uploaded"}), 400
        
        df = pd.read_csv(file)
        required_cols = ['name', 'year', 'dept_name']
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            return jsonify({"error": f"CSV must contain columns: {', '.join(missing_cols)}"}), 400
        
        added_count = 0
        for _, row in df.iterrows():
            dept = Department.query.filter_by(dept_name=row['dept_name']).first()
            if not dept:
                continue
            if not Section.query.filter_by(name=row['name'], year=int(row['year']), dept_id=dept.id).first():
                section = Section(name=row['name'], year=int(row['year']), dept_id=dept.id)
                db.session.add(section)
                added_count += 1
        db.session.commit()
        export_csvs()
        return jsonify({"message": f"Successfully added {added_count} sections"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
