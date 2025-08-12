const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const envFilePath = path.resolve(__dirname, '.env.development'); // Adjust path if your script is in a subfolder

// Function to get the IP address
function getLocalIpAddress() {
    return new Promise((resolve, reject) => {
        // This command is for Unix-like systems (Linux/macOS)
        // For Windows, you'd use 'ipconfig getifaddr en0' or parse 'ipconfig' output differently.
        const command = 'ifconfig | grep "inet " | grep -v 127.0.0.1 | cut -d\\  -f2 | head -n 1';

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error getting IP: ${error.message}`);
                return reject(error);
            }
            if (stderr) {
                console.warn(`Stderr getting IP: ${stderr}`);
            }
            const ip = stdout.trim();
            if (ip) {
                resolve(ip);
            } else {
                reject(new Error('Could not find a non-loopback IP address.'));
            }
        });
    });
}

async function updateEnvFile() {
    try {
        console.log('Fetching local IP address...');
        const localIp = await getLocalIpAddress();
        console.log(`Local IP found: ${localIp}`);

        console.log(`Reading ${envFilePath}...`);
        let envContent = fs.readFileSync(envFilePath, 'utf8');

        const emulatorHostRegex = /^REACT_APP_EMULATOR_HOST=.*$/m;
        const newEmulatorHostLine = `REACT_APP_EMULATOR_HOST=${localIp}`;

        if (envContent.match(emulatorHostRegex)) {
            envContent = envContent.replace(emulatorHostRegex, newEmulatorHostLine);
            console.log('REACT_APP_EMULATOR_HOST updated.');
        } else {
            // If the line doesn't exist, append it
            envContent += `\n${newEmulatorHostLine}`;
            console.log('REACT_APP_EMULATOR_HOST added.');
        }

        console.log(`Writing updated content to ${envFilePath}...`);
        fs.writeFileSync(envFilePath, envContent, 'utf8');
        console.log('Successfully updated .env.development with local IP address.');

    } catch (error) {
        console.error('Failed to update .env.development file:', error);
        process.exit(1); // Exit with a non-zero code to indicate failure
    }
}

updateEnvFile();