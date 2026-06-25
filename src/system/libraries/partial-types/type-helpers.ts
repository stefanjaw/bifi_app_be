import { Type } from "./type.type";

/** Applies the @IsOptional() decorator from class-validator on a target class property. */
export function applyIsOptionalDecorator(
  targetClass: Function,
  propertyKey: string
) {
  if (!isClassValidatorAvailable()) {
    return;
  }
  const classValidator: typeof import("class-validator") = require("class-validator");
  const decoratorFactory = classValidator.IsOptional();
  decoratorFactory(targetClass.prototype, propertyKey);
}

/** Applies the @ValidateIf((_, value) => value !== undefined) decorator on a target class property. */
export function applyValidateIfDefinedDecorator(
  targetClass: Function,
  propertyKey: string
) {
  if (!isClassValidatorAvailable()) {
    return;
  }
  const classValidator: typeof import("class-validator") = require("class-validator");
  const decoratorFactory = classValidator.ValidateIf(
    (_, value) => value !== undefined
  );
  decoratorFactory(targetClass.prototype, propertyKey);
}

/** Copies class-validator metadata (validation decorators) from parentClass to targetClass. @param parentClass - The source class with validation metadata. @param targetClass - The target class to copy metadata onto. @param isPropertyInherited - Optional filter function per property key. */
export function inheritValidationMetadata(
  parentClass: Type<any>,
  targetClass: Function,
  isPropertyInherited?: (key: string) => boolean
) {
  if (!isClassValidatorAvailable()) {
    return;
  }
  try {
    const classValidator: typeof import("class-validator") = require("class-validator");
    const metadataStorage: import("class-validator").MetadataStorage = (
      classValidator as any
    ).getMetadataStorage
      ? (classValidator as any).getMetadataStorage()
      : classValidator.getFromContainer(classValidator.MetadataStorage);

    const getTargetValidationMetadatasArgs = [parentClass, null!, false, false];
    const targetMetadata: ReturnType<
      typeof metadataStorage.getTargetValidationMetadatas
    > = (metadataStorage.getTargetValidationMetadatas as Function)(
      ...getTargetValidationMetadatasArgs
    );
    return targetMetadata
      .filter(
        ({ propertyName }) =>
          !isPropertyInherited || isPropertyInherited(propertyName)
      )
      .map((value) => {
        const originalType = Reflect.getMetadata(
          "design:type",
          parentClass.prototype,
          value.propertyName
        );
        if (originalType) {
          Reflect.defineMetadata(
            "design:type",
            originalType,
            targetClass.prototype,
            value.propertyName
          );
        }

        metadataStorage.addValidationMetadata({
          ...value,
          target: targetClass,
        });
        return value.propertyName;
      });
  } catch (err) {
    console.log(err);
  }
}

type TransformMetadataKey =
  | "_excludeMetadatas"
  | "_exposeMetadatas"
  | "_typeMetadatas"
  | "_transformMetadatas";

/** Copies class-transformer metadata (exclude/expose/transform/type) from parentClass to targetClass. @param parentClass - The source class with transformation metadata. @param targetClass - The target class to copy metadata onto. @param isPropertyInherited - Optional filter function per property key. @param stackDecorators - Whether to merge/stack decorators instead of replacing (default true). */
export function inheritTransformationMetadata(
  parentClass: Type<any>,
  targetClass: Function,
  isPropertyInherited?: (key: string) => boolean,
  stackDecorators = true
) {
  if (!isClassTransformerAvailable()) {
    return;
  }
  try {
    const transformMetadataKeys: TransformMetadataKey[] = [
      "_excludeMetadatas",
      "_exposeMetadatas",
      "_transformMetadatas",
      "_typeMetadatas",
    ];
    transformMetadataKeys.forEach((key) =>
      inheritTransformerMetadata(
        key,
        parentClass,
        targetClass,
        isPropertyInherited,
        stackDecorators
      )
    );
  } catch (err) {
    console.log(err);
  }
}

function inheritTransformerMetadata(
  key: TransformMetadataKey,
  parentClass: Type<any>,
  targetClass: Function,
  isPropertyInherited?: (key: string) => boolean,
  stackDecorators = true
) {
  let classTransformer: any;
  try {
    /** "class-transformer" >= v0.3.x */
    classTransformer = require("class-transformer/cjs/storage");
  } catch {
    /** "class-transformer" <= v0.3.x */
    classTransformer = require("class-transformer/storage");
  }
  const metadataStorage /*: typeof import('class-transformer/types/storage').defaultMetadataStorage */ =
    classTransformer.defaultMetadataStorage;

  while (parentClass && parentClass !== Object) {
    if (metadataStorage[key].has(parentClass)) {
      const metadataMap = metadataStorage[key] as Map<
        Function,
        Map<string, any>
      >;
      const parentMetadata = metadataMap.get(parentClass);

      const targetMetadataEntries: Iterable<[string, any]> = Array.from(
        parentMetadata!.entries()
      )
        .filter(([key]) => !isPropertyInherited || isPropertyInherited(key))
        .map(([key, metadata]) => {
          if (Array.isArray(metadata)) {
            // "_transformMetadatas" is an array of elements
            const targetMetadata = metadata.map((item) => ({
              ...item,
              target: targetClass,
            }));
            return [key, targetMetadata];
          }
          return [key, { ...metadata, target: targetClass }];
        });

      if (metadataMap.has(targetClass)) {
        const existingRules = metadataMap.get(targetClass)!.entries();
        const mergeMap = new Map<string, any[]>();

        [existingRules, targetMetadataEntries].forEach((entries) => {
          for (const [valueKey, value] of entries) {
            if (mergeMap.has(valueKey) && stackDecorators) {
              const parentValue = mergeMap.get(valueKey);

              if (Array.isArray(parentValue)) {
                // Merge parent and child arrays
                parentValue.push(...(Array.isArray(value) ? value : [value]));
              }
            } else {
              mergeMap.set(valueKey, value);
            }
          }
        });
        metadataMap.set(targetClass, mergeMap);
      } else {
        metadataMap.set(targetClass, new Map(targetMetadataEntries));
      }
    }
    parentClass = Object.getPrototypeOf(parentClass);
  }
}

function isClassValidatorAvailable() {
  try {
    require("class-validator");
    return true;
  } catch {
    return false;
  }
}

function isClassTransformerAvailable() {
  try {
    require("class-transformer");
    return true;
  } catch {
    return false;
  }
}

/**
 * Copies default property values from an instance of sourceClass onto target
 * when the target does not already have a value for that property.
 * @param target - The target object to copy initializers into.
 * @param sourceClass - The source class to instantiate for default values.
 * @param isPropertyInherited - Optional filter function per property key (default: all properties).
 */
export function inheritPropertyInitializers(
  target: Record<string, any>,
  sourceClass: Type<any>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPropertyInherited = (key: string) => true
) {
  try {
    const tempInstance = new sourceClass();
    const propertyNames = Object.getOwnPropertyNames(tempInstance);

    propertyNames
      .filter(
        (propertyName) =>
          typeof tempInstance[propertyName] !== "undefined" &&
          typeof target[propertyName] === "undefined"
      )
      .filter((propertyName) => isPropertyInherited(propertyName))
      .forEach((propertyName) => {
        target[propertyName] = tempInstance[propertyName];
      });
  } catch {
    // Ignore errors
  }
}
