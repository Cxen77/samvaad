
import http from 'http';

const req = http.get('http://localhost:5000/health', (res) => {
    console.log('STATUS:', res.statusCode);
    res.on('data', (d) => {
        console.log('BODY:', d.toString());
    });
});

req.on('error', (e) => {
    console.error('ERROR:', e.message);
});
