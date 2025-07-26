#import "OverrideMuteSwitchIOS.h"
#import <AVFoundation/AVFoundation.h>

@implementation OverrideMuteSwitchIOS


- (void)overrideMuteSwitch:(CDVInvokedUrlCommand*)command {
    AVAudioSession *session = [AVAudioSession sharedInstance];

    NSError *setCategoryError = nil;
    BOOL success = [session setCategory:AVAudioSessionCategoryPlayback
                            withOptions:AVAudioSessionCategoryOptionMixWithOthers
                                  error:&setCategoryError];

    if (!success) {
        NSLog(@"Failed to set audio session category: %@", setCategoryError);
    }

    NSError *activationError = nil;
    success = [session setActive:YES error:&activationError];

    if (!success) {
        NSLog(@"Failed to activate audio session: %@", activationError);
    }

    NSLog(@"Mute switch overridden!");
    
    // Send success callback to JS
    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Mute switch overridden!"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}



- (void)playTestSound:(CDVInvokedUrlCommand*)command {
    NSString *soundFilePath = [[NSBundle mainBundle] pathForResource:@"test-sound" ofType:@"mp3"];
    NSURL *soundURL = [NSURL fileURLWithPath:soundFilePath];

    NSError *error = nil;
    self.audioPlayer = [[AVAudioPlayer alloc] initWithContentsOfURL:soundURL error:&error];

    if (error) {
        NSLog(@"Error initializing audio player: %@", error);
        CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Failed to initialize audio player."];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
    }

    // Set the player to loop infinitely
    self.audioPlayer.numberOfLoops = -1;

    // Optional: set volume to 0 if you're using a non-silent sound
    self.audioPlayer.volume = 0.1;

    [self.audioPlayer prepareToPlay];
    [self.audioPlayer play];

    NSLog(@"Started looping test sound");

    CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"Started looping test sound"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}


@end
