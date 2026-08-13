"use strict";
/**
 * Shared Domain Types for CookingLab Serverless AWS
 * Representa las entidades principales del sistema y las claves DynamoDB (Single Table Design).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvents = exports.WORKSHOP_CATEGORIES = void 0;
exports.normalizeWorkshopCategory = normalizeWorkshopCategory;
exports.getWorkshopCategoryQueryValues = getWorkshopCategoryQueryValues;
exports.WORKSHOP_CATEGORIES = [
    'Pastelería',
    'Panadería',
    'Cocina Italiana',
    'Asados / Parrilla',
    'Coctelería',
    'Cocina Internacional',
    'Repostería',
    'Cocina Saludable',
    'Técnicas Básicas',
    'Vinos y Maridaje',
];
const WORKSHOP_CATEGORY_ALIASES = {
    Pastelería: ['Pastelería', 'Pasteleria', 'pastelería', 'pasteleria'],
    Panadería: ['Panadería', 'Panaderia', 'panadería', 'panaderia'],
    'Cocina Italiana': ['Cocina Italiana', 'cocina italiana', 'Italiana', 'italiana'],
    'Asados / Parrilla': ['Asados / Parrilla', 'Asados', 'Parrilla', 'asados', 'parrilla'],
    Coctelería: ['Coctelería', 'Cocteleria', 'coctelería', 'cocteleria'],
    'Cocina Internacional': ['Cocina Internacional', 'cocina internacional', 'Internacional', 'internacional'],
    Repostería: ['Repostería', 'Reposteria', 'repostería', 'reposteria'],
    'Cocina Saludable': ['Cocina Saludable', 'cocina saludable', 'Saludable', 'saludable'],
    'Técnicas Básicas': ['Técnicas Básicas', 'Tecnicas Basicas', 'técnicas básicas', 'tecnicas basicas'],
    'Vinos y Maridaje': ['Vinos y Maridaje', 'vinos y maridaje', 'Maridaje', 'maridaje'],
};
function normalizeCategoryKey(value) {
    return value
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}
function normalizeWorkshopCategory(value) {
    const normalizedValue = normalizeCategoryKey(value);
    return exports.WORKSHOP_CATEGORIES.find((category) => WORKSHOP_CATEGORY_ALIASES[category].some((alias) => normalizeCategoryKey(alias) === normalizedValue));
}
function getWorkshopCategoryQueryValues(value) {
    const category = normalizeWorkshopCategory(value);
    if (!category) {
        return [value];
    }
    return Array.from(new Set([category, ...WORKSHOP_CATEGORY_ALIASES[category]]));
}
exports.DomainEvents = {
    WORKSHOP_CREATED: "WORKSHOP_CREATED",
    STUDENT_REGISTERED: "STUDENT_REGISTERED",
};
