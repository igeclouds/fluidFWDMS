## API Report File for "@fluid-experimental/sequence-deprecated"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import { BaseSegment } from '@fluidframework/merge-tree';
import { IChannelAttributes } from '@fluidframework/datastore-definitions';
import { IChannelFactory } from '@fluidframework/datastore-definitions';
import { IChannelServices } from '@fluidframework/datastore-definitions';
import { IFluidDataStoreRuntime } from '@fluidframework/datastore-definitions';
import { IFluidHandle } from '@fluidframework/core-interfaces';
import { IJSONSegment } from '@fluidframework/merge-tree';
import { ISegment } from '@fluidframework/merge-tree';
import { ISharedObject } from '@fluidframework/shared-object-base';
import { Jsonable } from '@fluidframework/datastore-definitions';
import { PropertySet } from '@fluidframework/merge-tree';
import { Serializable } from '@fluidframework/datastore-definitions';
import { SharedSegmentSequence } from '@fluidframework/sequence';
import { SharedSequence } from '@fluidframework/sequence';
import { SubSequence } from '@fluidframework/sequence';

// @public @deprecated (undocumented)
export type MatrixSegment = RunSegment | PaddingSegment;

// @public @deprecated (undocumented)
export const maxCellPosition: number;

// @public @deprecated (undocumented)
export const maxCol = 2097152;

// @public @deprecated (undocumented)
export const maxCols: number;

// @public @deprecated (undocumented)
export const maxRow = 4294967295;

// @public @deprecated (undocumented)
export const maxRows: number;

// @public @deprecated
export class PaddingSegment extends BaseSegment {
    constructor(size: number);
    // (undocumented)
    append(segment: ISegment): void;
    // (undocumented)
    canAppend(segment: ISegment): boolean;
    // (undocumented)
    clone(start?: number, end?: number): PaddingSegment;
    // (undocumented)
    protected createSplitSegmentAt(pos: number): PaddingSegment;
    // (undocumented)
    static fromJSONObject(spec: any): PaddingSegment | undefined;
    // (undocumented)
    static is(segment: ISegment): segment is PaddingSegment;
    // (undocumented)
    removeRange(start: number, end: number): boolean;
    // (undocumented)
    toJSONObject(): {
        pad: number;
        props: PropertySet | undefined;
    };
    // (undocumented)
    toString(): string;
    // (undocumented)
    readonly type = "PaddingSegment";
    // (undocumented)
    static readonly typeString = "PaddingSegment";
}

// @public @deprecated (undocumented)
export function positionToRowCol(position: number): {
    row: number;
    col: number;
};

// @public @deprecated (undocumented)
export const rowColToPosition: (row: number, col: number) => number;

// @public @deprecated (undocumented)
export class RunSegment extends SubSequence<SparseMatrixItem> {
    constructor(items: SparseMatrixItem[]);
    // (undocumented)
    append(segment: ISegment): this;
    // (undocumented)
    clone(start?: number, end?: number): RunSegment;
    // (undocumented)
    protected createSplitSegmentAt(pos: number): RunSegment | undefined;
    // (undocumented)
    static fromJSONObject(spec: any): RunSegment | undefined;
    // (undocumented)
    getTag(pos: number): any;
    // (undocumented)
    static is(segment: ISegment): segment is RunSegment;
    // (undocumented)
    items: SparseMatrixItem[];
    // (undocumented)
    removeRange(start: number, end: number): boolean;
    // (undocumented)
    setTag(pos: number, tag: any): void;
    // (undocumented)
    readonly type = "RunSegment";
    // (undocumented)
    static readonly typeString = "RunSegment";
}

// @public @deprecated
export class SharedNumberSequence extends SharedSequence<number> {
    // @deprecated
    constructor(document: IFluidDataStoreRuntime, id: string, attributes: IChannelAttributes);
    // @deprecated
    static create(runtime: IFluidDataStoreRuntime, id?: string): SharedNumberSequence;
    // Warning: (ae-forgotten-export) The symbol "SharedNumberSequenceFactory" needs to be exported by the entry point index.d.ts
    //
    // @deprecated
    static getFactory(): SharedNumberSequenceFactory;
    // @deprecated (undocumented)
    getRange(start: number, end?: number): number[];
    // (undocumented)
    id: string;
}

// @public @deprecated
export class SharedObjectSequence<T> extends SharedSequence<T> {
    // @deprecated
    constructor(document: IFluidDataStoreRuntime, id: string, attributes: IChannelAttributes);
    // @deprecated
    static create<T>(runtime: IFluidDataStoreRuntime, id?: string): SharedObjectSequence<T>;
    // Warning: (ae-forgotten-export) The symbol "SharedObjectSequenceFactory" needs to be exported by the entry point index.d.ts
    //
    // @deprecated
    static getFactory(): SharedObjectSequenceFactory;
    // @deprecated (undocumented)
    getRange(start: number, end?: number): Serializable<T>[];
    // (undocumented)
    id: string;
}

// @public @deprecated (undocumented)
export class SparseMatrix extends SharedSegmentSequence<MatrixSegment> {
    constructor(document: IFluidDataStoreRuntime, id: string, attributes: IChannelAttributes);
    // (undocumented)
    annotatePosition(row: number, col: number, props: PropertySet): void;
    static create(runtime: IFluidDataStoreRuntime, id?: string): SparseMatrix;
    static getFactory(): IChannelFactory;
    // (undocumented)
    getItem(row: number, col: number): Jsonable<string | number | boolean | IFluidHandle> | undefined;
    // (undocumented)
    getPositionProperties(row: number, col: number): PropertySet | undefined;
    // (undocumented)
    getTag(row: number, col: number): any;
    // (undocumented)
    id: string;
    // (undocumented)
    insertCols(col: number, numCols: number): void;
    // (undocumented)
    insertRows(row: number, numRows: number): void;
    // (undocumented)
    get numRows(): number;
    // (undocumented)
    removeCols(col: number, numCols: number): void;
    // (undocumented)
    removeRows(row: number, numRows: number): void;
    // (undocumented)
    setItems(row: number, col: number, values: SparseMatrixItem[], props?: PropertySet): void;
    // (undocumented)
    setTag(row: number, col: number, tag: any): void;
}

// @public @deprecated (undocumented)
export class SparseMatrixFactory implements IChannelFactory {
    // (undocumented)
    static Attributes: IChannelAttributes;
    // (undocumented)
    get attributes(): IChannelAttributes;
    // (undocumented)
    create(document: IFluidDataStoreRuntime, id: string): ISharedObject;
    // (undocumented)
    load(runtime: IFluidDataStoreRuntime, id: string, services: IChannelServices, attributes: IChannelAttributes): Promise<ISharedObject>;
    // (undocumented)
    static segmentFromSpec(spec: IJSONSegment): ISegment;
    // (undocumented)
    static Type: string;
    // (undocumented)
    get type(): string;
}

// @public @deprecated (undocumented)
export type SparseMatrixItem = Serializable;

// (No @packageDocumentation comment for this package)

```