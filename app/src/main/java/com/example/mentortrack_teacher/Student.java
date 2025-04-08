package com.example.mentortrack_teacher;

public class Student {
    public String name, email, rollno, department, division, batch, year,
            phonenumber, parentphone, address, mentoremail, profileImage, password;

    public Student() {}

    public Student(String name, String email) {
        this.name = name;
        this.email = email;
    }

    public Student(String name, String email, String rollno, String department, String division,
                   String batch, String year, String phonenumber, String parentphone,
                   String address, String mentoremail, String profileImage, String password) {
        this.name = name;
        this.email = email;
        this.rollno = rollno;
        this.department = department;
        this.division = division;
        this.batch = batch;
        this.year = year;
        this.phonenumber = phonenumber;
        this.parentphone = parentphone;
        this.address = address;
        this.mentoremail = mentoremail;
        this.profileImage = profileImage;
        this.password = password;
    }
}
