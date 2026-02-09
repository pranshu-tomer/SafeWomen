declare module 'react-native-immediate-phone-call' {
    interface RNImmediatePhoneCall {
        immediatePhoneCall(phoneNumber: string): void;
    }

    const instance: RNImmediatePhoneCall;
    export default instance;
}
