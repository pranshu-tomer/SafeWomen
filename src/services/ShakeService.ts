import RNShake from 'react-native-shake';
import { EmitterSubscription } from 'react-native';

class ShakeService {
    private subscription: EmitterSubscription | null = null;

    /**
     * Start listening for shake events.
     * @param onShake  Callback invoked whenever a shake is detected.
     */
    start(onShake: () => void): void {
        // Guard: don't add duplicate listeners
        this.stop();
        this.subscription = RNShake.addListener(onShake);
        console.log('📳 ShakeService: started');
    }

    /**
     * Stop listening for shake events and clean up the subscription.
     */
    stop(): void {
        if (this.subscription) {
            this.subscription.remove();
            this.subscription = null;
            console.log('📳 ShakeService: stopped');
        }
    }
}

export default new ShakeService();
