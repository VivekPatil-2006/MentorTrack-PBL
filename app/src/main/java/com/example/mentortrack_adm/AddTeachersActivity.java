package com.example.mentortrack_adm;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.Toast;

import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.firestore.FirebaseFirestore;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Map;
import java.util.Properties;
import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;

import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

public class AddTeachersActivity extends AppCompatActivity {

    private static final int PICK_CSV_FILE = 1;
    private static final int PERMISSION_REQUEST_CODE = 100;
    private FirebaseFirestore db;
    private ProgressBar progressBar;
    private static final String ALLOWED_CHARACTERS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    private static final String TAG = "AddTeachersActivity";

    // Email configuration - REPLACE WITH YOUR CREDENTIALS
    private static final String ADMIN_EMAIL = "vivekcollege04@gmail.com";
    private static final String ADMIN_PASSWORD = "ynba dcdr rlkk emet"; // Generate in Google Account
    private static final String SMTP_HOST = "smtp.gmail.com";
    private static final int SMTP_PORT = 587;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_teachers);

        db = FirebaseFirestore.getInstance();
        progressBar = findViewById(R.id.progressBar);

        Button importButton = findViewById(R.id.import_button);
        importButton.setOnClickListener(view -> checkPermissionsAndOpenFilePicker());
    }

    private String generateRandomPassword(int length) {
        Random random = new Random();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALLOWED_CHARACTERS.charAt(random.nextInt(ALLOWED_CHARACTERS.length())));
        }
        return sb.toString();
    }

    private void checkPermissionsAndOpenFilePicker() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.READ_MEDIA_IMAGES},
                        PERMISSION_REQUEST_CODE);
            } else {
                openFilePicker();
            }
        } else if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.READ_EXTERNAL_STORAGE},
                    PERMISSION_REQUEST_CODE);
        } else {
            openFilePicker();
        }
    }

    private void openFilePicker() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        String[] mimeTypes = {"text/csv", "text/comma-separated-values", "application/octet-stream"};
        intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        startActivityForResult(intent, PICK_CSV_FILE);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                openFilePicker();
            } else {
                Toast.makeText(this, "Permission required to access files", Toast.LENGTH_SHORT).show();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PICK_CSV_FILE && resultCode == RESULT_OK && data != null) {
            Uri csvFileUri = data.getData();

            String fileName = getFileName(csvFileUri);
            if (fileName == null || !fileName.toLowerCase().endsWith(".csv")) {
                Toast.makeText(this, "Please select a valid CSV file", Toast.LENGTH_SHORT).show();
                return;
            }

            try {
                getContentResolver().takePersistableUriPermission(csvFileUri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION);
                uploadCsvToFirestore(csvFileUri);
            } catch (SecurityException e) {
                Toast.makeText(this, "Error accessing file. Please try again.", Toast.LENGTH_SHORT).show();
                Log.e(TAG, "SecurityException: ", e);
            }
        }
    }

    private String getFileName(Uri uri) {
        String displayName = null;
        try (Cursor cursor = getContentResolver().query(uri, null, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (nameIndex >= 0) {
                    displayName = cursor.getString(nameIndex);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting file name: ", e);
        }
        return displayName;
    }

    private void uploadCsvToFirestore(Uri csvFileUri) {
        progressBar.setVisibility(View.VISIBLE);

        new Thread(() -> {
            AtomicInteger successCount = new AtomicInteger(0);
            AtomicInteger errorCount = new AtomicInteger(0);

            try (InputStream inputStream = getContentResolver().openInputStream(csvFileUri);
                 BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {

                // Skip header line
                reader.readLine();

                String line;
                int totalLines = 0;

                // First pass - count lines
                while (reader.readLine() != null) {
                    totalLines++;
                }

                // Reset reader
                reader.close();
                InputStream newStream = getContentResolver().openInputStream(csvFileUri);
                BufferedReader newReader = new BufferedReader(new InputStreamReader(newStream));
                newReader.readLine(); // Skip header again

                // Second pass - process data
                while ((line = newReader.readLine()) != null) {
                    String[] values = line.split(",");
                    if (values.length > 0) {
                        String email = values[0].trim();
                        if (!email.isEmpty() && android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                            String password = generateRandomPassword(8);
                            Map<String, Object> teacherData = new HashMap<>();
                            teacherData.put("email",email);
                            teacherData.put("password", password);

                            int finalTotalLines = totalLines;
                            db.collection("teachers").document(email)
                                    .set(teacherData)
                                    .addOnSuccessListener(aVoid -> {
                                        successCount.incrementAndGet();
                                        runOnUiThread(() -> Toast.makeText(AddTeachersActivity.this,
                                                "Sending credentials to: " + email,
                                                Toast.LENGTH_SHORT).show());
                                        sendCredentialsEmail(email, password, "Teacher");
                                        checkCompletion(successCount.get() + errorCount.get(), finalTotalLines);
                                    })
                                    .addOnFailureListener(e -> {
                                        errorCount.incrementAndGet();
                                        Log.e(TAG, "Error adding document: ", e);
                                        runOnUiThread(() -> Toast.makeText(AddTeachersActivity.this,
                                                "Failed to add: " + email,
                                                Toast.LENGTH_SHORT).show());
                                        checkCompletion(successCount.get() + errorCount.get(), finalTotalLines);
                                    });
                        }
                    }
                }

            } catch (Exception e) {
                Log.e(TAG, "Error processing CSV: ", e);
                runOnUiThread(() -> {
                    progressBar.setVisibility(View.GONE);
                    Toast.makeText(AddTeachersActivity.this,
                            "Error reading file: " + e.getMessage(),
                            Toast.LENGTH_LONG).show();
                });
            }
        }).start();
    }

    private void sendCredentialsEmail(String teacherEmail, String password, String userType) {
        new AsyncTask<Void, Void, String>() {
            @Override
            protected String doInBackground(Void... voids) {
                try {
                    Properties props = new Properties();
                    props.put("mail.smtp.auth", "true");
                    props.put("mail.smtp.starttls.enable", "true");
                    props.put("mail.smtp.host", SMTP_HOST);
                    props.put("mail.smtp.port", SMTP_PORT);
                    props.put("mail.smtp.ssl.trust", SMTP_HOST);
                    props.put("mail.smtp.ssl.protocols", "TLSv1.2");
                    props.put("mail.smtp.connectiontimeout", "5000");
                    props.put("mail.smtp.timeout", "5000");

                    Session session = Session.getInstance(props,
                            new Authenticator() {
                                protected PasswordAuthentication getPasswordAuthentication() {
                                    return new PasswordAuthentication(ADMIN_EMAIL, ADMIN_PASSWORD);
                                }
                            });

                    session.setDebug(true);

                    Message message = new MimeMessage(session);
                    message.setFrom(new InternetAddress(ADMIN_EMAIL));
                    message.setRecipients(Message.RecipientType.TO,
                            InternetAddress.parse(teacherEmail));
                    message.setSubject("Your " + userType + " Login Credentials");
                    message.setText("Dear " + userType + ",\n\n"
                            + "Your login credentials for the college portal are:\n\n"
                            + "Email: " + teacherEmail + "\n"
                            + "Password: " + password + "\n\n"
                            + "Please keep this information secure.\n\n"
                            + "Best regards,\n"
                            + "Admin Team\n"
                            + "Vivek College");

                    Transport.send(message);
                    return "Success";
                } catch (Exception e) {
                    Log.e(TAG, "Error sending email: ", e);
                    return "Error: " + e.getMessage();
                }
            }

            @Override
            protected void onPostExecute(String result) {
                Log.d(TAG, "Email send result for " + ADMIN_EMAIL + ": " + result);
                if (result.startsWith("Error")) {
                    runOnUiThread(() -> Toast.makeText(AddTeachersActivity.this,
                            "Failed to send email: " + result,
                            Toast.LENGTH_LONG).show());
                }
            }
        }.execute();
    }

    private void checkCompletion(int processed, int total) {
        if (processed >= total) {
            runOnUiThread(() -> {
                progressBar.setVisibility(View.GONE);
                Toast.makeText(AddTeachersActivity.this,
                        "Import complete. Processed " + processed + " records",
                        Toast.LENGTH_LONG).show();
            });
        }
    }
}