/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */

import assert from "assert";
import { ContainerRuntimeFactoryWithDefaultDataStore } from "@fluidframework/aqueduct";
import {
    ICodeLoader,
    IProvideRuntimeFactory,
    IFluidModule,
} from "@fluidframework/container-definitions";
import { IFluidCodeDetails, IProvideFluidCodeDetailsComparer, IRequest } from "@fluidframework/core-interfaces";
import { IContainerRuntimeBase, IProvideFluidDataStoreFactory,
    IProvideFluidDataStoreRegistry } from "@fluidframework/runtime-definitions";
import { createDataStoreFactory } from "@fluidframework/runtime-utils";
import { IContainerRuntimeOptions } from "@fluidframework/container-runtime";

export type SupportedExportInterfaces = Partial<
    IProvideRuntimeFactory &
    IProvideFluidDataStoreFactory &
    IProvideFluidDataStoreRegistry &
    IProvideFluidCodeDetailsComparer>;

// Represents the entry point for a Fluid container.
export type fluidEntryPoint = SupportedExportInterfaces | IFluidModule;

/**
 * A simple code loader that caches a mapping of package name to a Fluid entry point.
 * On load, it retrieves the entry point matching the package name in the given code details.
 */
export class LocalCodeLoader implements ICodeLoader {
    private readonly fluidPackageCache = new Map<string, IFluidModule>();

    constructor(
        packageEntries: Iterable<[IFluidCodeDetails, fluidEntryPoint]>,
        runtimeOptions?: IContainerRuntimeOptions,
    ) {
        for (const entry of packageEntries) {
            // Store the entry point against a unique id in the fluidPackageCache.
            // For code details containing a package name, use the package name as the id.
            // For code details containing a Fluid package, create a unique id from the package name and version.
            let pkgId: string;

            const source = entry[0];
            if (typeof source.package === "string") {
                pkgId = source.package;
            } else {
                pkgId = `${source.package.name}@${source.package.version}`;
            }
            let fluidModule = entry[1] as IFluidModule;
            if (fluidModule?.fluidExport === undefined) {
                const maybeExport = fluidModule as SupportedExportInterfaces;

                if (maybeExport.IRuntimeFactory !== undefined) {
                    fluidModule = { fluidExport: maybeExport };
                } else {
                    assert(maybeExport.IFluidDataStoreFactory !== undefined);
                    const defaultFactory = createDataStoreFactory("default", maybeExport.IFluidDataStoreFactory);
                    const innerRequestHandler = async (request: IRequest, runtime: IContainerRuntimeBase) =>
                        runtime.IFluidHandleContext.resolveHandle(request);
                    fluidModule = {
                        fluidExport: {
                            ... maybeExport,
                            IRuntimeFactory:
                                new ContainerRuntimeFactoryWithDefaultDataStore(
                                    defaultFactory,
                                    [[defaultFactory.type, Promise.resolve(defaultFactory)]],
                                    undefined,
                                    [innerRequestHandler],
                                    runtimeOptions,
                                ),
                        },
                    };
                }
            }

            this.fluidPackageCache.set(pkgId, fluidModule);
        }
    }

    /**
     * It finds the entry point for the package name in the given source and return it
     * as a Fluid module.
     * @param source - Details of where to find chaincode
     */
    public async load(
        source: IFluidCodeDetails,
    ): Promise<IFluidModule> {
        // Get the entry point for from the fluidPackageCache for the given code details.
        // For code details containing a package name, use the package name as the id.
        // For code details containing a Fluid package, create a unique id from the package name and version.
        let pkdId: string;

        if (typeof source.package === "string") {
            pkdId = source.package;
        } else {
            pkdId = `${source.package.name}@${source.package.version}`;
        }

        const entryPoint = this.fluidPackageCache.get(pkdId);
        if (entryPoint === undefined) {
            throw new Error(`Cannot find package ${pkdId}`);
        }
        return entryPoint;
    }
}
