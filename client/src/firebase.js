import { initializeApp } from 'firebase/app';

const firebaseConfig = {
        type: "service_account",
        project_id: "mentortrack-fe806",
        private_key_id: "88bc7a1c5f7723612ac462e56ea73f7da6adad59",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQCxVMy7MJnUD/RT\n+aZUzIXXsyvJehqYWrvrAiRgk1z1RQPk7OTDIYjHv30zbs2kFYLfwjhqcBRqLYhj\nxWl6bPGlL5sLf2d5ZtHRZFAP/iioIhxhHYUxVe13aNmHTYqOde/g3IwL3ze2+pCS\ntS5AKrvQzAmTITDnEx1RUFT8ciex5HuJHuFxL9aRBnam4ycvgopgJQ01i2o8Jvw2\nEUMcLdGktJ1Y+FAgFVQy71/fuu1SKi3WrfB/rnAPKibQ9uzDX5crsLSH+aLE+0+p\n+WvJEvuiK2l7xkvTzd9ILrtEqL0mKL905YvQDV+FBO7yWUeagMMDRiT/5sfvqFvQ\nGQ4e1cSFAgMBAAECgf84oJvAKwT0cyPSrSYwbh9Pgie5bwSPImpf4Y88R9KngCJ+\nOCfVKCBFqSCSDBAfFb91NNBPLPtX7LJhKelE7wU7erhIM6cXXX4jH6VxdfgFuN7X\nJFYkKwxp1VGho2FbnM29QLB4Gg/wnpMMRk8+rmbLhlyIX1D+eVwjW0PIWavTYlp8\n3Qjw3T8P4jXcLziMuhRnFKLrbyQix/ZKm/rHtN+QwiQJfJ+w9pgVeyM/hBKqTpNw\nd3R/N405VIoIKT/JlQOsgIZKwQMBnbi5fmWGAC9YreD6Ofw3j9VmQEDYZOMavnXR\ntCKTcXUAjLbKfuB8M46gb645V5wsgLFth3LdqmkCgYEA6BpRlZfu81nA7AjchIcq\n5prsrJN6W4y7o36pit+9Kg6Vq/ZgGeahr1XyswkqV00BhmMgTEAhToUP1MwbU2T1\nrVo56Yxuv0FyHiKBQbomweOYC3gZ+q+G7OHhJG2hRlLqRp/8lO1IN7fieJpe+jXe\nxTDb6yJF0nrMnr8QhN/mJH0CgYEAw5bVDdTfOZAcwwD/VfxGAuAea5erF9xJYFFo\nb8ZtCvFODW0nwc0kdoaiu8c1jNdYb+EFwIu784joLN9vdxVaF/1A76PFb53A2MfG\nEoSs8WpzWNOWg2wneSzjbENjHZT8ggdInlQKul66ciU3n6e2/ySjMlFsPjaofE4v\nSJibxqkCgYAKZ7Okmy0RJ8LoUfVg05ZuxB88FVh05jg7OiBro2AdlI3NKbxhLN+u\ntpGsyQpm44Lf/W2jPXTAymJNTeEjufDxlovmFm+Yj1yIUU+uHKREKOnWCcpQXLIV\nyIKJWYjTWEA8bkuqeYC1Tr8OXQ1I9kVIXcpeHik3KF4n97TL4CW3GQKBgEHjyDZ2\nphTARdAzv9D5waQqWFUqrQrGvTljc2lkUUvEauT/Bsu1DjmXta7It3ORAEwAZG2v\nJUwvrPeg9e4KFWXLfVq9sz+cx2DAPCv04kYZ9G3SKfxwLQQXaS4JrZRDoqUzSvV7\nnnmWe/0EKK7yUyW08/15jJuQ0kW+GRO9xYyxAoGAWdkQ+xot6bZHDb/fYxUiTBeE\n/dVb7QNyEvAedsgK3hFnZ+GeuJKt/bhJJoTbIOf2cLywr82OK0CYrQVO8PG1Ls59\nV/Ok151Xx6THWSn/77NfUkUqeRHRtsrvFKQg0RcUHkewzC8GGuLeI7RiDpM6eNBq\nunTHxUdUE7eNiGXN3xg=\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-fbsvc@mentortrack-fe806.iam.gserviceaccount.com",
        client_id: "109317724218352729706",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40mentortrack-fe806.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
      
      
};

const app = initializeApp(firebaseConfig);

export { app };