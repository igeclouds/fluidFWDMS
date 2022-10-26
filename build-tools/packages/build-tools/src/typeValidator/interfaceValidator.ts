/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
import { DiagnosticCategory, InterfaceDeclaration, Node, Project, TypeChecker } from "ts-morph";

import {
    getCallSignatureReplacement,
    getIndexSignatureReplacement,
    getMethodReplacement,
    getPropertyReplacement,
} from "./memberDecomposition";
import { GenericsInfo, decomposeType, typeToString } from "./typeDecomposition";
import { BreakingIncrement, IValidator, log } from "./validatorUtils";

/**
 * Total result of a class decomposition which may be reconstructed into an equivalent class
 * declaration to bypass issues with normal class type comparisions
 */
interface InterfaceData {
    readonly name: string;
    readonly typeParameters: string[];
    readonly properties: string[];
    readonly replacedTypes: Set<string>;
    readonly requiredGenerics: GenericsInfo;
}

function mergeIntoSet<T>(into: Set<T>, from: Set<T>) {
    from.forEach((v) => into.add(v));
}

/**
 * A decent chunk of this is similar/identical to ClassValidator and could maybe be refactored
 */
export class InterfaceValidator implements IValidator {
    private oldTypeData?: InterfaceData;
    private newTypeData?: InterfaceData;

    public decomposeDeclarations(
        oldTypeChecker: TypeChecker,
        oldDecl: InterfaceDeclaration,
        newTypeChecker: TypeChecker,
        newDecl: InterfaceDeclaration,
    ) {
        this.oldTypeData = this.decompose(oldTypeChecker, oldDecl);
        this.newTypeData = this.decompose(newTypeChecker, newDecl);
    }

    /**
     * Break down a normal interface declaration into all its parts to facilitate type comparison
     *
     * - Remove external type dependencies to examine separately
     * - Do not consider declaration merging
     *
     * - Do not consider unusual interactions with inheritance.  E.g. InterfaceA extends ClassA, and
     *   ClassB implements InterfaceA but does not extend ClassA.  If a private property myPrivateProp
     *   is added on ClassA, ClassB will no longer be valid because it will be either missing a
     *   declaration for myPrivateProp or its declaration of myPrivateProp will be considered separate
     *   from that of ClassA's because it does not directly extend ClassA.
     *
     * @param typeChecker - The TypeChecker object from the node's TS project for getting type names
     * @param node - The interface declaration node to decompose
     * @returns - InterfaceData for the decomposed interface declaration
     */
    private decompose(typeChecker: TypeChecker, node: InterfaceDeclaration): InterfaceData {
        const replacedTypes = new Set<string>();
        const replacedMembers: string[] = [];
        const requiredGenerics = new GenericsInfo();
        const typeParameters: string[] = [];

        node.getTypeParameters().forEach((tp) => {
            typeParameters.push(typeToString(typeChecker, tp.getType()));
        });

        // Convert extensions and implementations to properties for comparison because they
        // can't be replaced as string literal types
        // Interface declarations can have any number of extends expressions unlike classes
        const extendsExprs = node.getExtends();
        for (const extendsExpr of extendsExprs) {
            const result = decomposeType(typeChecker, extendsExpr.getType());
            mergeIntoSet(replacedTypes, result.replacedTypes);
            requiredGenerics.merge(result.requiredGenerics);
            const typeName = typeToString(typeChecker, extendsExpr.getType()).replace(
                /[^\w]/g,
                "_",
            );
            replacedMembers.push(`__extends__${typeName}: ${result.typeAsString};`);
        }

        for (const member of node.getMembers()) {
            if (Node.isMethodSignature(member)) {
                const replacement = getMethodReplacement(
                    typeChecker,
                    requiredGenerics,
                    replacedTypes,
                    member,
                );
                replacedMembers.push(replacement);
            } else if (Node.isPropertySignature(member)) {
                const replacement = getPropertyReplacement(
                    typeChecker,
                    requiredGenerics,
                    replacedTypes,
                    member,
                );
                replacedMembers.push(replacement);
            } else if (Node.isCallSignatureDeclaration(member)) {
                const replacement = getCallSignatureReplacement(
                    typeChecker,
                    requiredGenerics,
                    replacedTypes,
                    member,
                );
                replacedMembers.push(replacement);
            } else if (Node.isIndexSignatureDeclaration(member)) {
                const replacement = getIndexSignatureReplacement(
                    typeChecker,
                    requiredGenerics,
                    replacedTypes,
                    member,
                );
                replacedMembers.push(replacement);
            } else if (Node.isConstructSignatureDeclaration(member)) {
                throw new Error("interface construct signature declarations not implemented");
            } else {
                throw new Error("unhandled member declaration type");
            }
            // TODO: get/set accessor declarations are unhandled here (they currently do not
            // show up in the member enumeration)
        }

        return {
            name: node.getName()!,
            typeParameters,
            properties: replacedMembers,
            replacedTypes,
            requiredGenerics,
        };
    }

    public validate(project: Project, pkgDir: string): BreakingIncrement {
        // Check for major increment.  This may also tell us a minor increment is required
        // in some situations
        const typeIncrement = this.checkMajorIncrement(project, pkgDir);
        if (typeIncrement !== BreakingIncrement.none) {
            return typeIncrement;
        } else if (this.checkMinorIncrement(project, pkgDir)) {
            // If no major increment, check for minor increment
            return BreakingIncrement.minor;
        } else {
            return BreakingIncrement.none;
        }
    }

    private checkMajorIncrement(project: Project, pkgDir: string): BreakingIncrement {
        if (this.oldTypeData === undefined || this.newTypeData === undefined) {
            throw new Error("missing typedata");
        }

        // Check for major increment through transitivity then bivariant assignment
        // Type decomposition will have converted the interface into a form where this is
        // valid for finding major breaking changes
        const testFile = this.buildTestFileMajor(
            `old${this.oldTypeData.name}`,
            this.oldTypeData,
            `new${this.newTypeData.name}`,
            this.newTypeData,
        );
        log(testFile);

        // Create a source file in the project and check for diagnostics
        const sourcePath = `${pkgDir}/src/test/typeValidation.spec.ts`;
        const sourceFile = project.createSourceFile(sourcePath, testFile);
        const diagnostics = sourceFile.getPreEmitDiagnostics();
        for (const diagnostic of diagnostics) {
            if (diagnostic.getCategory() === DiagnosticCategory.Error) {
                log(diagnostic.getMessageText().toString());
            } else {
                log(`non-error diagnostic found: ${diagnostic.getMessageText().toString()}`);
            }
        }

        project.removeSourceFile(sourceFile);

        if (diagnostics.length > 0) {
            return BreakingIncrement.major;
        }
        return BreakingIncrement.none;
    }

    private checkMinorIncrement(project: Project, pkgDir: string): BreakingIncrement {
        if (this.oldTypeData === undefined || this.newTypeData === undefined) {
            throw new Error("missing typedata");
        }

        // check for minor increment by comparing exact types
        const testFile = this.buildTestFileMinor(
            `old${this.oldTypeData.name}`,
            this.oldTypeData,
            `new${this.newTypeData.name}`,
            this.newTypeData,
        );
        log(testFile);

        // Create a source file in the project and check for diagnostics
        const sourcePath = `${pkgDir}/src/test/typeValidation.spec.ts`;
        const sourceFile = project.createSourceFile(sourcePath, testFile);
        const diagnostics = sourceFile.getPreEmitDiagnostics();
        for (const diagnostic of diagnostics) {
            if (diagnostic.getCategory() === DiagnosticCategory.Error) {
                log(diagnostic.getMessageText().toString());
            } else {
                log(`non-error diagnostic found: ${diagnostic.getMessageText().toString()}`);
            }
        }

        project.removeSourceFile(sourceFile);

        if (diagnostics.length > 0) {
            return BreakingIncrement.minor;
        }
        return BreakingIncrement.none;
    }

    private buildTestFileMajor(
        oldName: string,
        oldData: InterfaceData,
        newName: string,
        newData: InterfaceData,
    ): string {
        const fileLines: string[] = [];

        const requiredGenerics = new GenericsInfo(oldData.requiredGenerics);
        requiredGenerics.merge(newData.requiredGenerics);
        for (const [generic, paramCount] of requiredGenerics) {
            const numberArray = Array.from(Array(paramCount).keys());
            const typeParams = numberArray.map((n) => `T${n} = any`).join(", ");
            const typedProperties = numberArray.map((n) => `myVar${n}: T${n};`).join("\n");
            fileLines.push(`interface ${generic}<${typeParams}> {`);
            fileLines.push(typedProperties);
            fileLines.push(`};`);
        }

        let oldTypeParameters = oldData.typeParameters.join(", ");
        oldTypeParameters = oldTypeParameters === "" ? oldTypeParameters : `<${oldTypeParameters}>`;
        fileLines.push(`declare class ${oldName}${oldTypeParameters} {`);
        fileLines.push(...oldData.properties);
        fileLines.push("}");

        let newTypeParameters = newData.typeParameters.join(", ");
        newTypeParameters = newTypeParameters === "" ? newTypeParameters : `<${newTypeParameters}>`;
        fileLines.push(`declare class ${newName}${newTypeParameters} {`);
        fileLines.push(...newData.properties);
        fileLines.push("}");

        const oldTypeArgs = oldData.typeParameters.map(() => "any").join(", ");
        const oldClassType = oldTypeArgs === "" ? oldName : `${oldName}<${oldTypeArgs}>`;
        const newTypeArgs = newData.typeParameters.map(() => "any").join(", ");
        const newClassType = newTypeArgs === "" ? newName : `${newName}<${newTypeArgs}>`;
        fileLines.push(`const oldToNew: ${newClassType} = undefined as any as ${oldClassType}`);
        fileLines.push(`const newToOld: ${oldClassType} = undefined as any as ${newClassType}`);

        const declaration = fileLines.join("\n");
        return declaration;
    }

    private buildTestFileMinor(
        oldName: string,
        oldData: InterfaceData,
        newName: string,
        newData: InterfaceData,
    ): string {
        const fileLines: string[] = [];

        fileLines.push(`type Equals<X, Y> = (<T>() => (T extends X ? 1 : 2)) extends`);
        fileLines.push(`    (<T>() => (T extends Y ? 1 : 2)) ? true : false;`);
        fileLines.push(`let trueVal: true = true;`);

        const requiredGenerics = new GenericsInfo(oldData.requiredGenerics);
        requiredGenerics.merge(newData.requiredGenerics);
        for (const [generic, paramCount] of requiredGenerics) {
            const numberArray = Array.from(Array(paramCount).keys());
            const typeParams = numberArray.map((n) => `T${n} = any`).join(", ");
            const typedProperties = numberArray.map((n) => `myVar${n}: T${n};`).join("\n");
            fileLines.push(`interface ${generic}<${typeParams}> {`);
            fileLines.push(typedProperties);
            fileLines.push(`};`);
        }

        let oldTypeParameters = oldData.typeParameters.join(", ");
        oldTypeParameters = oldTypeParameters === "" ? oldTypeParameters : `<${oldTypeParameters}>`;
        fileLines.push(`declare class ${oldName}${oldTypeParameters} {`);
        fileLines.push(...oldData.properties);
        fileLines.push("}");

        let newTypeParameters = newData.typeParameters.join(", ");
        newTypeParameters = newTypeParameters === "" ? newTypeParameters : `<${newTypeParameters}>`;
        fileLines.push(`declare class ${newName}${newTypeParameters} {`);
        fileLines.push(...newData.properties);
        fileLines.push("}");

        const oldTypeArgs = oldData.typeParameters.map(() => "any").join(", ");
        const oldClassType = oldTypeArgs === "" ? oldName : `${oldName}<${oldTypeArgs}>`;
        const newTypeArgs = newData.typeParameters.map(() => "any").join(", ");
        const newClassType = newTypeArgs === "" ? newName : `${newName}<${newTypeArgs}>`;
        fileLines.push(`trueVal = undefined as any as Equals<${newClassType}, ${oldClassType}>;`);

        const declaration = fileLines.join("\n");
        return declaration;
    }
}
