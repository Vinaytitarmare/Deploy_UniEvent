const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(env, argv);
    
    // Suppress the react-native-worklets warning
    config.ignoreWarnings = [
        {
            module: /node_modules\/react-native-worklets/,
            message: /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
        },
    ];
    
    return config;
};
