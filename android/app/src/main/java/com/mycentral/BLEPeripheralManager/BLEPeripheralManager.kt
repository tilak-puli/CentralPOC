package com.mycentral;

import android.util.Log
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BLEPeripheralManager(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "BLEPeripheralManager"


    @ReactMethod fun start(text: String) {
        Log.d("BLEPeripheralManager", "Called start with text: $text")
    }
}
