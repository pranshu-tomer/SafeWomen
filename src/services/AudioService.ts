import axios from 'axios';
import { Platform, PermissionsAndroid } from 'react-native';
import Sound from 'react-native-nitro-sound';
import RNFS from 'react-native-fs';

import { API_URL } from '@env';

type PredictionCallback = (result: { threat: boolean; details?: string }) => void;

class AudioService {
    private isMonitoring = false;
    private intervalId: any = null;

    async startMonitoring(onPrediction: PredictionCallback) {
        if (this.isMonitoring) return;

        if (Platform.OS === 'android') {
            try {
                const grants = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                ]);

                console.log('Permissions result:', grants);

                if (
                    grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED
                ) {
                    console.log('Permissions granted');
                } else {
                    console.log('All required permissions not granted');
                    return;
                }
            } catch (err) {
                console.warn(err);
                return;
            }
        }

        this.isMonitoring = true;
        console.log('Starting monitoring...');

        this.recordAndAnalyze(onPrediction);
    }

    stopMonitoring() {
        this.isMonitoring = false;
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
        try {
            Sound.stopRecorder();
            Sound.removeRecordBackListener();
        } catch (e) {
            console.warn("Error checking recorder stop", e);
        }
        console.log('Monitoring stopped.');
    }

    private async recordAndAnalyze(onPrediction: PredictionCallback) {
        if (!this.isMonitoring) return;

        try {
            // Start recording
            // Note: react-native-nitro-sound might accept specific path configs
            const path = Platform.select({
                ios: 'hello.wav',
                android: `${RNFS.CachesDirectoryPath}/hello.wav`,
            });

            let uri = "mock_uri";
            try {
                if (path) {
                    uri = await Sound.startRecorder(path);
                } else {
                    // Fallback if path is undefined/null (though Platform.select usually returns one)
                    uri = await Sound.startRecorder('default_record.wav');
                }

                Sound.addRecordBackListener((e: any) => { return; });
            } catch (e) {
                console.error("Error starting recorder", e);
            }
            console.log('Recording started at', uri);

            // Record for 5 seconds
            this.intervalId = setTimeout(async () => {
                if (!this.isMonitoring) return;

                try {
                    await Sound.stopRecorder();
                    Sound.removeRecordBackListener();
                } catch (e) { console.warn("Stop recorder error", e); }

                console.log('Recording stopped. Analyzing...');

                // Send to backend
                try {
                    const formData = new FormData();
                    formData.append('audio', {
                        uri: uri,
                        type: 'audio/wav',
                        name: 'audio.wav',
                    } as any);

                    console.log('API_URL:', API_URL);
                    // Using localhost with adb reverse
                    const response = await axios.post(`https://jacalyn-catechismal-termly.ngrok-free.dev/predict`, formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                    console.log('Prediction response:', response.data);
                    if (response.data.threat) {
                        onPrediction(response.data);
                        this.stopMonitoring();
                    } else {
                        // Continue loop
                        if (this.isMonitoring) {
                            this.recordAndAnalyze(onPrediction);
                        }
                    }

                } catch (error) {
                    console.error('Prediction error:', error);
                    // Retry loop anyway
                    if (this.isMonitoring) {
                        this.recordAndAnalyze(onPrediction);
                    }
                }

            }, 5000); // 5 seconds chunk

        } catch (error) {
            console.error('Recording error:', error);
            this.isMonitoring = false;
        }
    }
}

export default new AudioService();