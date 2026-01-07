# Attach a file (like timetable CSV)
if attachment_path:
    with open(attachment_path, "rb") as f:
        msg.attach(
            filename=os.path.basename(attachment_path),
            content_type="text/csv",
            data=f.read()
        )
