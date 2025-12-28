@echo off
echo Creating assets folder...
if not exist "assets" mkdir assets

echo Copying placeholder images...
copy "..\cloud-functions\node_modules\@jest\reporters\assets\jest_logo.png" "assets\icon.png" /Y
copy "..\cloud-functions\node_modules\@jest\reporters\assets\jest_logo.png" "assets\splash.png" /Y
copy "..\cloud-functions\node_modules\@jest\reporters\assets\jest_logo.png" "assets\adaptive-icon.png" /Y
copy "..\cloud-functions\node_modules\@jest\reporters\assets\jest_logo.png" "assets\favicon.png" /Y

echo Installing dependencies...
call npx expo install expo-notifications
call npx expo install --fix

echo Done! Try running the app now.
pause
