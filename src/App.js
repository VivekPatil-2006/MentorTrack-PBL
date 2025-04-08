import React, { useState } from 'react';
import {
  Button,
  Box,
  Snackbar,
  Alert,
  TextField,
  Typography,
  Avatar,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CloudUpload,
  Search,
  Email,
  Person,
  School,
  Group,
  Download,
  FilterList,
  AssignmentInd,
  Visibility
} from '@mui/icons-material';
import { db } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs, query, where, updateDoc } from 'firebase/firestore';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

function App() {
  const [loading, setLoading] = useState({ teachers: false, students: false });
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'info' });
  const [failedEmails, setFailedEmails] = useState([]);
  const [searchInputs, setSearchInputs] = useState({ student: '', teacher: '' });
  const [searchedStudent, setSearchedStudent] = useState(null);
  const [searchedTeacher, setSearchedTeacher] = useState(null);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [filterInputs, setFilterInputs] = useState({ department: '', year: '', batch: '' });
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const departments = ['Computer', 'IT', 'ENTC', 'AIDS', 'ECE'];
  const years = ['First Year', 'Second Year', 'Third Year', 'Final Year'];

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const sendCredentialsEmail = async (email, password) => {
    try {
      const response = await fetch('http://localhost:3001/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  };

  const importData = async (file, collectionName) => {
    setLoading(prev => ({ ...prev, [collectionName]: true }));
    setFailedEmails([]);

    return new Promise((resolve) => {
      Papa.parse(file, {
        complete: async (results) => {
          const emails = results.data
            .map(row => row[0])
            .filter(email => email)
            .map(email => email.trim().toLowerCase())
            .filter(email => isValidEmail(email));

          if (emails.length === 0) {
            setAlert({
              open: true,
              message: `No valid emails found in the ${collectionName} CSV file.`,
              severity: 'warning'
            });
            resolve({ imported: 0, duplicates: 0, emailsSent: 0 });
            return;
          }

          let importedCount = 0;
          let duplicateCount = 0;
          let emailsSentCount = 0;
          const failed = [];

          for (const email of emails) {
            const docRef = await getDoc(doc(db, collectionName, email));

            if (docRef.exists()) {
              duplicateCount++;
              continue;
            }

            const password = uuidv4().slice(0, 8);

            await setDoc(doc(db, collectionName, email), {
              email,
              password,
              createdAt: new Date().toISOString()
            });

            const emailSent = await sendCredentialsEmail(email, password);
            if (emailSent) {
              emailsSentCount++;
            } else {
              failed.push({ email, password });
            }

            importedCount++;
          }

          setFailedEmails(failed);
          resolve({ imported: importedCount, duplicates: duplicateCount, emailsSent: emailsSentCount });
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          setAlert({ open: true, message: "Error parsing CSV file.", severity: 'error' });
          resolve({ imported: 0, duplicates: 0, emailsSent: 0 });
        }
      });
    });
  };

  const handleFileUpload = async (event, collectionName) => {
    const file = event.target.files[0];
    if (!file) return;

    const { imported, duplicates, emailsSent } = await importData(file, collectionName);

    let message = `Imported ${imported} ${collectionName} successfully!`;
    if (duplicates > 0) message += ` ${duplicates} duplicates skipped.`;
    if (emailsSent < imported) message += ` ${imported - emailsSent} emails failed to send.`;

    setAlert({ open: true, message, severity: emailsSent === imported ? 'success' : 'warning' });
    setLoading(prev => ({ ...prev, [collectionName]: false }));
    event.target.value = '';
  };

  const handleCloseAlert = () => setAlert(prev => ({ ...prev, open: false }));

  const downloadFailedEmails = () => {
    const csvContent = "Email,Password\n" + failedEmails.map(({ email, password }) => `${email},${password}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'failed_credentials.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSearch = async (type) => {
    const email = searchInputs[type].trim().toLowerCase();
    if (!isValidEmail(email)) {
      setAlert({ open: true, message: 'Enter a valid email.', severity: 'warning' });
      return;
    }

    try {
      const docSnap = await getDoc(doc(db, type === 'student' ? 'students' : 'teachers', email));

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (type === 'teacher') {
          setSearchedTeacher({ ...data, email });

          // Fetch assigned students
          const subColRef = collection(db, `teachers/${email}/assignedstudents`);
          const snapshot = await getDocs(subColRef);
          const emails = snapshot.docs.map(doc => doc.id);
          setAssignedStudents(emails);
        } else {
          setSearchedStudent(data);
        }
        setAlert({ open: true, message: `${type.charAt(0).toUpperCase() + type.slice(1)} found!`, severity: 'success' });
      } else {
        setAlert({ open: true, message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found!`, severity: 'error' });
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      setAlert({ open: true, message: 'Error occurred while searching.', severity: 'error' });
    }
  };

  const handleDepartmentChange = async (event) => {
    const dept = event.target.value;
    setSelectedDept(dept);

    const q = query(collection(db, 'teachers'), where('department', '==', dept));
    const snapshot = await getDocs(q);
    const teachersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setFilteredTeachers(teachersList);
  };

  const handleTeacherClick = async (teacher) => {
    setSelectedTeacher(teacher);
    const subColRef = collection(db, `teachers/${teacher.email}/assignedstudents`);
    const snapshot = await getDocs(subColRef);
    const emails = snapshot.docs.map(doc => doc.id);
    setAssignedStudents(emails);
  };

  const handleFilterStudents = async () => {
    const { department, year, batch } = filterInputs;
    const q = query(
      collection(db, 'students'),
      where('department', '==', department),
      where('year', '==', year),
      where('batch', '==', batch)
    );

    const snapshot = await getDocs(q);
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setFilteredStudents(students);

    setAlert({
      open: true,
      message: `${students.length} student(s) found.`,
      severity: 'info'
    });
  };

  const handleAssignMentor = async () => {
    if (!selectedTeacher) return;

    for (const student of filteredStudents) {
      const studentRef = doc(db, 'students', student.email);
      await updateDoc(studentRef, {
        mentoremail: selectedTeacher.email
      });
    }

    setAlert({
      open: true,
      message: `Mentor assigned to ${filteredStudents.length} student(s).`,
      severity: 'success'
    });

    setFilteredStudents([]);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Mentor Management System
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage teachers, students, and mentor assignments
        </Typography>
      </Paper>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Data Import" icon={<CloudUpload />} />
        <Tab label="Mentor Assignment" icon={<AssignmentInd />} />
        <Tab label="Search" icon={<Search />} />
      </Tabs>

      {activeTab === 0 && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <CloudUpload sx={{ mr: 1 }} /> Import Data
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title="Import Teachers"
                  avatar={<Person color="primary" />}
                />
                <CardContent>
                  <label>
                    <input
                      accept=".csv"
                      style={{ display: 'none' }}
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'teachers')}
                    />
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<CloudUpload />}
                      disabled={loading.teachers}
                      fullWidth
                    >
                      {loading.teachers ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Upload Teachers CSV'
                      )}
                    </Button>
                  </label>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    CSV should contain a single column of teacher emails
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardHeader
                  title="Import Students"
                  avatar={<Group color="primary" />}
                />
                <CardContent>
                  <label>
                    <input
                      accept=".csv"
                      style={{ display: 'none' }}
                      type="file"
                      onChange={(e) => handleFileUpload(e, 'students')}
                    />
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<CloudUpload />}
                      disabled={loading.students}
                      fullWidth
                    >
                      {loading.students ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Upload Students CSV'
                      )}
                    </Button>
                  </label>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                    CSV should contain a single column of student emails
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {failedEmails.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                onClick={downloadFailedEmails}
                startIcon={<Download />}
              >
                Download Failed Emails
              </Button>
              <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                {failedEmails.length} emails failed to send
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {activeTab === 1 && (
        <>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <FilterList sx={{ mr: 1 }} /> Filter Teachers
            </Typography>
            <FormControl sx={{ minWidth: 200, mr: 2 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDept}
                onChange={handleDepartmentChange}
                label="Department"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {filteredTeachers.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                <School sx={{ mr: 1, verticalAlign: 'middle' }} />
                Teachers in {selectedDept} Department
              </Typography>
              <Grid container spacing={2}>
                {filteredTeachers.map((teacher) => (
                  <Grid item xs={12} sm={6} md={4} key={teacher.id}>
                    <Card
                      variant="outlined"
                      sx={{
                        cursor: 'pointer',
                        borderLeft: selectedTeacher?.email === teacher.email
                          ? '4px solid #3f51b5'
                          : '1px solid rgba(0, 0, 0, 0.12)',
                        '&:hover': {
                          boxShadow: 2
                        }
                      }}
                      onClick={() => handleTeacherClick(teacher)}
                    >
                      <CardHeader
                        avatar={
                          <Avatar src={`data:image/jpeg;base64,${teacher.profileImage}`}>
                            {teacher.name.charAt(0)}
                          </Avatar>
                        }
                        title={teacher.name}
                        subheader={teacher.email}
                        action={
                          <Tooltip title="View Assigned Students">
                            <IconButton>
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        }
                      />
                      <CardContent>
                        <Chip
                          label={teacher.department}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Phone: {teacher.phone}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {selectedTeacher && (
            <>
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <FilterList sx={{ mr: 1 }} /> Filter Students for {selectedTeacher.name}
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={filterInputs.department}
                        label="Department"
                        onChange={(e) =>
                          setFilterInputs((prev) => ({
                            ...prev,
                            department: e.target.value
                          }))
                        }
                      >
                        {departments.map((dept) => (
                          <MenuItem key={dept} value={dept}>
                            {dept}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Year</InputLabel>
                      <Select
                        value={filterInputs.year}
                        label="Year"
                        onChange={(e) =>
                          setFilterInputs((prev) => ({
                            ...prev,
                            year: e.target.value
                          }))
                        }
                      >
                        {years.map((yr) => (
                          <MenuItem key={yr} value={yr}>
                            {yr}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      label="Batch"
                      value={filterInputs.batch}
                      onChange={(e) =>
                        setFilterInputs((prev) => ({
                          ...prev,
                          batch: e.target.value
                        }))
                      }
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <Button
                      variant="contained"
                      onClick={handleFilterStudents}
                      fullWidth
                      sx={{ height: '56px' }}
                    >
                      Filter
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {filteredStudents.length > 0 && (
                <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      {filteredStudents.length} Students Found
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={handleAssignMentor}
                      startIcon={<AssignmentInd />}
                    >
                      Assign as Mentor
                    </Button>
                  </Box>
                  <List dense>
                    {filteredStudents.map((student) => (
                      <ListItem key={student.email}>
                        <ListItemAvatar>
                          <Avatar src={`data:image/jpeg;base64,${student.profileImage}`}>
                            {student.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={student.name}
                          secondary={`${student.email} • ${student.department}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  <Group sx={{ mr: 1 }} /> Students Assigned to {selectedTeacher.name}
                </Typography>
                {assignedStudents.length > 0 ? (
                  <List dense>
                    {assignedStudents.map((email, idx) => (
                      <ListItem key={idx}>
                        <ListItemText primary={email} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary">No students assigned yet</Typography>
                )}
              </Paper>
            </>
          )}
        </>
      )}

      {activeTab === 2 && (
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Search sx={{ mr: 1 }} /> Search Records
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Search Student by Email"
                value={searchInputs.student}
                onChange={(e) =>
                  setSearchInputs((prev) => ({
                    ...prev,
                    student: e.target.value
                  }))
                }
                fullWidth
                InputProps={{
                  endAdornment: (
                    <Button
                      variant="contained"
                      onClick={() => handleSearch('student')}
                      startIcon={<Search />}
                    >
                      Search
                    </Button>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Search Teacher by Email"
                value={searchInputs.teacher}
                onChange={(e) =>
                  setSearchInputs((prev) => ({
                    ...prev,
                    teacher: e.target.value
                  }))
                }
                fullWidth
                InputProps={{
                  endAdornment: (
                    <Button
                      variant="contained"
                      onClick={() => handleSearch('teacher')}
                      startIcon={<Search />}
                    >
                      Search
                    </Button>
                  )
                }}
              />
            </Grid>
          </Grid>

          {searchedStudent && (
            <Card sx={{ mb: 3 }}>
              <CardHeader
                avatar={
                    <Avatar
                      src={`data:image/jpeg;base64,${searchedStudent.profileImage}`}
                      sx={{ width: 60, height: 60 }}
                    />
                }
                title={searchedStudent.name}
                subheader={searchInputs.student}
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Roll No:</strong> {searchedStudent.rollno}
                    </Typography>
                    <Typography>
                      <strong>Phone:</strong> {searchedStudent.phonenumber}
                    </Typography>
                    <Typography>
                      <strong>Address:</strong> {searchedStudent.address}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Department:</strong> {searchedStudent.department}
                    </Typography>
                    <Typography>
                      <strong>Year:</strong> {searchedStudent.year}
                    </Typography>
                    <Typography>
                      <strong>Batch:</strong> {searchedStudent.batch}
                    </Typography>
                    <Typography>
                      <strong>Parent Phone:</strong> {searchedStudent.parentphone}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {searchedTeacher && (
            <Card>
              <CardHeader
                avatar={
                    <Avatar
                      src={`data:image/jpeg;base64,${searchedTeacher.profileImage}`}
                      sx={{ width: 60, height: 60 }}
                    />
                }
                title={searchedTeacher.name}
                subheader={searchedTeacher.email}
                titleTypographyProps={{ variant: 'h6' }}
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Phone:</strong> {searchedTeacher.phone}
                    </Typography>
                    <Typography>
                      <strong>Address:</strong> {searchedTeacher.address}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Department:</strong> {searchedTeacher.department}
                    </Typography>
                    <Chip
                      label={searchedTeacher.department}
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}
        </Paper>
      )}

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;