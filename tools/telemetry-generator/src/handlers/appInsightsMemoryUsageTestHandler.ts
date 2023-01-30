/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * This handler emits metrics to the Azure App Insights instance configured by the telemetryClient provided to this handler.
 * This handler expects the 'telemetryClient' arg to be TelemetryClient class from the 'applicationinsights' Azure package.
 */
module.exports = async function handler(fileData, telemetryClient) {
    fileData.tests.forEach(async (testData) => {
        const heapUsedAvgMetricName = `${fileData.suiteName}_${testData.testName}_heapUsedAvg`;
        try {
            console.log(`emitting metric ${heapUsedAvgMetricName} with value ${testData.testData.stats.mean}`);
            await telemetryClient.trackMetric({
                name: heapUsedAvgMetricName,
                value: testData.testData.stats.mean,
                namespace: 'performance_benchmark_memoryUsage',
                properties: {
                    buildId: process.env.BUILD_ID,
                    branchName: process.env.BRANCH_NAME,
                    category: "performance",
                    eventName: "Benchmark",
                    benchmarkType: "MemoryUsage",
                    suiteName: fileData.suiteName,
                    testName: testData.testName,
                }
            });
        } catch (error) {
            console.error(`failed to emit metric ${heapUsedAvgMetricName}`, error);
        }

        const heapUsedStdDevMetricName = `${fileData.suiteName}_${testData.testName}_heapUsedStdDev`;
        try {
            console.log(`emitting metric ${heapUsedStdDevMetricName} with value ${testData.testData.stats.deviation}`)
            await telemetryClient.trackMetric({
                name: heapUsedStdDevMetricName,
                value: testData.testData.stats.deviation,
                namespace: 'performance_benchmark_memoryUsage',
                properties: {
                    buildId: process.env.BUILD_ID,
                    branchName: process.env.BRANCH_NAME,
                    category: "performance",
                    eventName: "Benchmark",
                    benchmarkType: "MemoryUsage",
                    suiteName: fileData.suiteName,
                    testName: testData.testName,
                }
            });
        } catch (error) {
            console.error(`failed to emit metric ${heapUsedStdDevMetricName}`, error);
        }
    });
};
