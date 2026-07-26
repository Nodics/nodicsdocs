'use strict';

/**
 * @description Documentation page and component type records.
 * @generated This file is generated from source/articles. Do not edit manually.
 */
module.exports = {
    "record0": {
        "code": "nodicsDocumentationArticlePageType",
        "kind": "PAGE",
        "contractVersion": 1,
        "active": true
    },
    "record1": {
        "code": "nodicsDocumentationArticleComponentType",
        "kind": "COMPONENT",
        "contractVersion": 1,
        "propertySchema": {
            "title": "string",
            "route": "string",
            "category": "string",
            "audience": "array",
            "headings": "array",
            "blocks": "array",
            "links": "array",
            "media": "array",
            "source": "object",
            "packVersion": "string"
        },
        "active": true
    },
    "record2": {
        "code": "nodicsDocumentationNavigationComponentType",
        "kind": "COMPONENT",
        "contractVersion": 1,
        "propertySchema": {
            "title": "string",
            "searchLabel": "string",
            "searchPlaceholder": "string",
            "emptyMessage": "string",
            "items": "array",
            "packVersion": "string"
        },
        "active": true
    }
};
