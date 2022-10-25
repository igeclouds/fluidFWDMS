/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
import React from "react";

import { LoadableObjectRecord } from "@fluidframework/fluid-static";

import { SharedObjectRendererOptions } from "../RendererOptions";
import { FluidObjectView } from "./data-object-views";
import { Accordion } from "./utility-components";

/**
 * {@link DataObjectsView} input props.
 */
export interface DataObjectsViewProps {
    /**
     * The {@link Container}'s {@link Container.initialObjects} to be displayed.
     */
    initialObjects: LoadableObjectRecord;

    /**
     * {@inheritDoc RendererOptions}
     */
    sharedObjectRenderers: SharedObjectRendererOptions;
}

/**
 * View containing a drop-down style view of {@link DataObjectsViewProps.initialObjects}.
 *
 * @remarks
 *
 * Dispatches data object rendering based on those provided view {@link DataObjectsViewProps.sharedObjectRenderers}.
 */
export function DataObjectsView(props: DataObjectsViewProps): React.ReactElement {
    const { initialObjects, sharedObjectRenderers } = props;

    const objects = Object.entries(initialObjects).map(([key, value]) => ({
        name: key,
        loadableObject: value,
    }));

    const children = objects.map((object) => (
        <Accordion header={<b>{object.name}</b>}>
            <FluidObjectView
                fluidObjectHandle={object.loadableObject.handle}
                sharedObjectRenderers={sharedObjectRenderers}
            />
        </Accordion>
    ));

    return (
        <div className="data-objects-view">
            <h3>Data Objects</h3>
            {children}
        </div>
    );
}
