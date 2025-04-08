package com.example.mentortrack_adm;

public class Student {
    private String id;
    private String name;
    private String email;
    private String password;
    private String phonenumber;
    private String department;
    private String year;
    private String division;
    private String batch;
    private String rollno;
    private String address;
    private String parentphone;
    private String mentoremail;

    public Student() {
        // Required empty constructor for Firestore
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getPhonenumber() { return phonenumber; }
    public void setPhonenumber(String phonenumber) { this.phonenumber = phonenumber; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public String getDivision() { return division; }
    public void setDivision(String division) { this.division = division; }

    public String getBatch() { return batch; }
    public void setBatch(String batch) { this.batch = batch; }

    public String getRollno() { return rollno; }
    public void setRollno(String rollno) { this.rollno = rollno; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getParentphone() { return parentphone; }
    public void setParentphone(String parentphone) { this.parentphone = parentphone; }

    public String getMentoremail() { return mentoremail; }
    public void setMentoremail(String mentoremail) { this.mentoremail = mentoremail; }
}