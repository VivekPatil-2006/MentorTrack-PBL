package com.example.mentortrack_adm;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Button;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

public class PasswordActivity extends AppCompatActivity {

    private TextInputEditText passwordEditText;
    private TextInputLayout passwordInputLayout;
    private TextView tvError;
    private MaterialButton btnSubmit;
    private Button b1;
    private ProgressBar progressBar;
    private static final String CORRECT_PASSWORD = "197678";
    private static final int DELAY_MILLIS = 3000; // 3 seconds

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_password);

        // Initialize views
        passwordEditText = findViewById(R.id.passwordEditText);
        passwordInputLayout = findViewById(R.id.passwordInputLayout);
        tvError = findViewById(R.id.tvError);
        btnSubmit = findViewById(R.id.btnSubmit);
        progressBar = findViewById(R.id.progressBar);

        /*
        b1=findViewById(R.id.direct);
        b1.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Intent intent=new Intent(getApplicationContext(),MainActivity.class);
                startActivity(intent);
            }
        });

         */

        // Submit button click listener
        btnSubmit.setOnClickListener(v -> checkPassword());

        // Handle keyboard done action
        passwordEditText.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                checkPassword();
                return true;
            }
            return false;
        });

        // Clear error when user starts typing
        passwordEditText.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus && tvError.getVisibility() == View.VISIBLE) {
                tvError.setVisibility(View.INVISIBLE);
                passwordInputLayout.setBoxStrokeColor(getResources().getColor(R.color.purple_500));
            }
        });
    }

    private void checkPassword() {
        String enteredPassword = passwordEditText.getText().toString().trim();

        if (enteredPassword.isEmpty()) {
            showError("Please enter password");
            return;
        }

        if (enteredPassword.equals(CORRECT_PASSWORD)) {
            // Show progress bar and disable input
            progressBar.setVisibility(View.VISIBLE);
            btnSubmit.setEnabled(false);
            passwordEditText.setEnabled(false);

            // Hide keyboard
            View view = this.getCurrentFocus();
            if (view != null) {
                InputMethodManager imm = (InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
                imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
            }

            // Delay navigation for 3 seconds
            new Handler().postDelayed(() -> {
                // Password correct, proceed to MainActivity
                Intent intent = new Intent(PasswordActivity.this, MainActivity.class);
                startActivity(intent);
                finish();
            }, DELAY_MILLIS);
        } else {
            showError("Incorrect password. Please try again.");
        }
    }

    private void showError(String message) {
        tvError.setText(message);
        tvError.setVisibility(View.VISIBLE);
        passwordInputLayout.setBoxStrokeColor(getResources().getColor(android.R.color.holo_red_dark));
        passwordEditText.requestFocus();
    }
}