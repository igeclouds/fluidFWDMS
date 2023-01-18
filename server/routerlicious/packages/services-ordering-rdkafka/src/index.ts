/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

var SegfaultHandler = require('segfault-handler');
SegfaultHandler.registerHandler("crash.log"); // With no argument, SegfaultHandler will generate a generic log file name

export { IKafkaConsumerOptions, RdkafkaConsumer } from "./rdkafkaConsumer";
export { IKafkaProducerOptions, RdkafkaProducer } from "./rdkafkaProducer";
export { IRdkafkaResources, RdkafkaResources, RdkafkaResourcesFactory } from "./resourcesFactory";
