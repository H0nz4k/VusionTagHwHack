import serial
try:
    s = serial.Serial("/dev/ttyACM0", 9600, timeout=1, exclusive=True)
    print("EXCL_OK")
    s.close()
except Exception as e:
    print("EXCL_FAIL", type(e).__name__, e)
try:
    s = serial.Serial("/dev/ttyACM0", 9600, timeout=1, exclusive=False)
    print("SHARE_OK")
    s.close()
except Exception as e:
    print("SHARE_FAIL", type(e).__name__, e)
