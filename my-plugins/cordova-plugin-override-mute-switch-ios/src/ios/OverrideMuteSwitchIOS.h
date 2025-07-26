#import <Cordova/CDV.h>
#import <AVFoundation/AVFoundation.h>

@interface OverrideMuteSwitchIOS : CDVPlugin

@property (nonatomic, strong) AVAudioPlayer* audioPlayer;

- (void)overrideMuteSwitch:(CDVInvokedUrlCommand*)command;
- (void)playTestSound:(CDVInvokedUrlCommand*)command;

@end
