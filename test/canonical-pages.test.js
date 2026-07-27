'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { walkFiles } = require('../scripts/lib/content-utils');

const root = path.resolve(__dirname, '..');
const pages = walkFiles(
    path.join(root, 'source', 'pages'),
    filePath => filePath.endsWith('.json')
).map(filePath => JSON.parse(fs.readFileSync(filePath, 'utf8')));

test('first canonical journey covers discovery and framework orientation', () => {
    const codes = new Set(pages.map(page => page.code));
    [
        'discover.overview',
        'evaluate.capabilities',
        'evaluate.checklist',
        'evaluate.comparison',
        'evaluate.security-trust',
        'evaluate.value',
        'getting-started.setup',
        'getting-started.first-capability',
        'framework.architecture'
    ].forEach(code => assert.equal(codes.has(code), true, code));
});

test('framework orientation belongs to Discover without owning capability hubs', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    const architecture = byCode.get('framework.architecture');

    assert.equal(architecture.section, 'discover');
    assert.equal(architecture.parent, 'section:discover');
    pages.filter(page => page.section === 'capabilities')
        .forEach(page => assert.notEqual(page.parent, 'page:framework.architecture', page.code));
});

test('canonical pages use capability names and explicit ordered navigation', () => {
    pages.forEach(page => {
        assert.equal(page.title.startsWith('nConfig'), false);
        assert.equal(Number.isInteger(page.order), true);
        assert.equal(page.route.startsWith('/docs/'), true);
    });
});

test('search journey covers engines, provider extension, lifecycle, import, export, and operations', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.query-modeling.overview',
        'capability.query-modeling.concepts',
        'capability.query-modeling.tutorial',
        'capability.query-modeling.technical-reference',
        'capability.search-indexing.overview',
        'capability.search-indexing.prebuilt-engines',
        'capability.search-indexing.provider-development',
        'capability.search-indexing.lifecycle',
        'capability.search-indexing.import-export',
        'capability.search-indexing.operations',
        'capability.search-indexing.technical-reference'
    ].forEach(code => assert.equal(byCode.has(code), true, code));

    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('capability.search-indexing.prebuilt-engines'), /Elasticsearch/);
    assert.match(serialized('capability.search-indexing.overview'), /OpenSearch/);
    assert.match(serialized('capability.search-indexing.overview'), /Solr/);
    assert.match(serialized('capability.search-indexing.provider-development'), /provider module/i);
    assert.match(serialized('capability.search-indexing.lifecycle'), /reconcil/i);
    assert.match(serialized('capability.search-indexing.import-export'), /nImport/);
    assert.match(serialized('capability.search-indexing.import-export'), /nExport/);
    assert.match(serialized('capability.search-indexing.operations'), /production qualification/i);
});

test('provider documentation standard governs every external adapter family', () => {
    const standard = fs.readFileSync(
        path.join(root, 'docs', 'provider-documentation-standard.md'),
        'utf8'
    );
    [
        'database',
        'cache',
        'search',
        'messaging',
        'AI',
        'storage',
        'identity',
        'notification',
        'payment'
    ].forEach(capability => assert.match(standard, new RegExp(capability, 'i')));
    [
        'provider-neutral',
        'Prebuilt providers',
        'Building a provider',
        'Lifecycle and resilience',
        'Import and export interaction',
        'Cross-capability assessment',
        'Operations and verification'
    ].forEach(section => assert.match(standard, new RegExp(section, 'i')));
});

test('framework foundation journey covers configuration, layers, schemas, and validation', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.configuration.overview',
        'capability.configuration.business-value',
        'capability.configuration.runtime',
        'capability.configuration.customization',
        'capability.configuration.technical-reference',
        'capability.layered-architecture.overview',
        'capability.layered-architecture.ownership',
        'capability.layered-architecture.runtime',
        'capability.layered-architecture.customization',
        'capability.layered-architecture.technical-reference',
        'capability.schema-modeling.overview',
        'capability.schema-modeling.runtime',
        'capability.schema-modeling.relationships',
        'capability.schema-modeling.tutorial',
        'capability.schema-modeling.technical-reference',
        'capability.validation.overview',
        'capability.validation.layers',
        'capability.validation.runtime',
        'capability.validation.tutorial',
        'capability.validation.technical-reference'
    ].forEach(code => assert.equal(byCode.has(code), true, code));
});

test('framework foundation content preserves authority and customization contracts', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    const serialized = code => JSON.stringify(byCode.get(code));

    assert.match(serialized('capability.configuration.customization'), /package\.json/);
    assert.match(serialized('capability.configuration.runtime'), /rollback/i);
    assert.match(serialized('capability.layered-architecture.ownership'), /duplicate authority/i);
    assert.match(serialized('capability.layered-architecture.runtime'), /monoServer/);
    assert.match(serialized('capability.schema-modeling.runtime'), /base properties are composed at runtime/i);
    assert.match(serialized('capability.schema-modeling.relationships'), /different modules/i);
    assert.match(serialized('capability.schema-modeling.tutorial'), /database client/i);
    assert.match(serialized('capability.validation.overview'), /service-to-service/i);
    assert.match(serialized('capability.validation.layers'), /frontend/i);
    ['positive', 'negative', 'boundar', 'contract', 'integration', 'regression'].forEach(testKind => {
        assert.match(
            serialized('capability.validation.tutorial'),
            new RegExp(testKind, 'i')
        );
    });
});

test('provider-integrated capability journey covers persistence, cache, events, import, and export', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.persistence.overview',
        'capability.persistence.prebuilt-providers',
        'capability.persistence.provider-development',
        'capability.persistence.lifecycle',
        'capability.persistence.operations',
        'capability.persistence.technical-reference',
        'capability.caching.overview',
        'capability.caching.prebuilt-providers',
        'capability.caching.provider-development',
        'capability.caching.lifecycle',
        'capability.caching.operations',
        'capability.caching.technical-reference',
        'capability.events-messaging.overview',
        'capability.events-messaging.delivery',
        'capability.events-messaging.provider-development',
        'capability.events-messaging.lifecycle',
        'capability.events-messaging.operations',
        'capability.events-messaging.technical-reference',
        'capability.data-exchange.guide',
        'capability.data-exchange.import',
        'capability.data-exchange.export',
        'capability.data-exchange.provider-development',
        'capability.data-exchange.lifecycle',
        'capability.data-exchange.operations',
        'capability.data-exchange.technical-reference'
    ].forEach(code => assert.equal(byCode.has(code), true, code));
});

test('provider-integrated pages preserve maturity and cross-capability truth', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    const serialized = code => JSON.stringify(byCode.get(code));

    assert.match(serialized('capability.persistence.prebuilt-providers'), /standalone local server is not transaction-qualified/i);
    assert.match(serialized('capability.persistence.provider-development'), /generic DAO/i);
    assert.match(serialized('capability.caching.prebuilt-providers'), /fail-closed extension slot/i);
    assert.match(serialized('capability.caching.lifecycle'), /authoritative/i);
    assert.match(serialized('capability.events-messaging.delivery'), /local listener call is not durable messaging/i);
    assert.match(serialized('capability.events-messaging.provider-development'), /provider-neutral EMS contract/i);
    assert.match(serialized('capability.data-exchange.import'), /arbitrary request URLs and credentials are forbidden/i);
    assert.match(serialized('capability.data-exchange.export'), /fails closed/i);
    assert.match(serialized('capability.data-exchange.lifecycle'), /No parallel authority/i);
    [
        'capability.persistence.technical-reference',
        'capability.caching.technical-reference',
        'capability.events-messaging.technical-reference',
        'capability.data-exchange.technical-reference'
    ].forEach(code => {
        ['positive', 'negative', 'boundar', 'contract', 'integration', 'regression'].forEach(testKind => {
            assert.match(serialized(code), new RegExp(testKind, 'i'), `${code}:${testKind}`);
        });
    });
});

test('application execution journey preserves layer ownership and end-to-end contracts', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.services-facades.overview', 'capability.services-facades.runtime',
        'capability.services-facades.technical-reference', 'capability.apis-routing.overview',
        'capability.apis-routing.runtime', 'capability.apis-routing.technical-reference',
        'capability.execution-processes.overview', 'capability.execution-processes.runtime',
        'capability.execution-processes.technical-reference', 'capability.libraries-utilities.overview',
        'capability.libraries-utilities.runtime', 'capability.libraries-utilities.technical-reference',
        'capability.status-errors.overview', 'capability.status-errors.runtime',
        'capability.status-errors.technical-reference'
    ].forEach(code => assert.equal(byCode.has(code), true, code));

    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('capability.services-facades.runtime'), /human login separate from service identity/i);
    assert.match(serialized('capability.apis-routing.runtime'), /authTokenTypes/);
    assert.match(serialized('capability.execution-processes.overview'), /durable business processes belong to workflow/i);
    assert.match(serialized('capability.libraries-utilities.overview'), /second utility, enum, error, or status registry/i);
    assert.match(serialized('capability.status-errors.runtime'), /public responses expose only allowlisted fields/i);
});

test('identity and security journey preserves separate principals and backend authority', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.identity-security.overview',
        'capability.identity-security.authentication',
        'capability.identity-security.authorization',
        'capability.identity-security.tenancy',
        'capability.identity-security.governance'
    ].forEach(code => assert.equal(byCode.has(code), true, code));

    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('capability.identity-security.overview'), /three distinct security boundaries/i);
    assert.match(serialized('capability.identity-security.overview'), /Axis is never for customer accounts/i);
    assert.match(serialized('capability.identity-security.authentication'), /HttpOnly/);
    assert.match(serialized('capability.identity-security.authentication'), /authTokenTypes/);
    assert.match(serialized('capability.identity-security.authorization'), /Cross-tenant internal-token access requires a separate permission/i);
    assert.match(serialized('capability.identity-security.authorization'), /backend services remain authoritative/i);
    assert.match(serialized('capability.identity-security.tenancy'), /caller may narrow but never broaden/i);
    assert.match(serialized('capability.identity-security.governance'), /local fallback disabled/i);
});

test('business process journey preserves scheduling, workflow, publishing, and operational authorities', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.scheduled-jobs.overview', 'capability.scheduled-jobs.runtime',
        'capability.scheduled-jobs.technical-reference', 'capability.workflows.overview',
        'capability.workflows.runtime', 'capability.workflows.technical-reference',
        'capability.content-publishing.overview', 'capability.content-publishing.runtime',
        'capability.content-publishing.technical-reference', 'capability.operational-governance.overview',
        'capability.operational-governance.runtime', 'capability.operational-governance.technical-reference'
    ].forEach(code => assert.equal(byCode.has(code), true, code));

    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('capability.scheduled-jobs.overview'), /never human credentials/i);
    assert.match(serialized('capability.workflows.overview'), /manual or automatic/i);
    assert.match(serialized('capability.workflows.overview'), /Pipeline: bounded technical execution/i);
    assert.match(serialized('capability.content-publishing.overview'), /separate online authority/i);
    assert.match(serialized('capability.content-publishing.overview'), /nPublish is the single provider-neutral publication lifecycle/i);
    assert.match(serialized('capability.operational-governance.overview'), /never become mutation authorities/i);
});

test('commerce journey composes independent storefront, product, pricing, stock, and unit authorities', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.commerce.overview', 'capability.commerce.storefront',
        'capability.commerce.stores-warehouses', 'capability.commerce.products',
        'capability.commerce.pricing', 'capability.commerce.stock-units',
        'capability.commerce.end-to-end'
    ].forEach(code => assert.equal(byCode.has(code), true, code));
    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('capability.commerce.overview'), /separate commerce authorities/i);
    assert.match(serialized('capability.commerce.storefront'), /apparel\.nodics\.com/);
    assert.match(serialized('capability.commerce.products'), /without duplicating CMS, Pricing, Inventory, or Units authority/i);
    assert.match(serialized('capability.commerce.pricing'), /deterministic/i);
    assert.match(serialized('capability.commerce.stock-units'), /land and agricultural inventory/i);
    assert.match(serialized('capability.commerce.end-to-end'), /BackOffice and Storefront are not data-plane proxies/i);
});

test('AI journey preserves provider, data, tool, workflow, and cost authorities', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.ai.overview', 'capability.ai.providers',
        'capability.ai.cost-governance', 'capability.ai.knowledge',
        'capability.ai.assistant', 'capability.ai.agentic-processes',
        'capability.ai.partner-customization', 'capability.ai.technical-reference'
    ].forEach(code => assert.equal(byCode.has(code), true, code));
    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('capability.ai.overview'), /never connect directly to a database/i);
    assert.match(serialized('capability.ai.providers'), /caller supplies a usage-profile code/i);
    assert.match(serialized('capability.ai.cost-governance'), /reserve estimated usage atomically/i);
    assert.match(serialized('capability.ai.knowledge'), /direct database reads.*prohibited/i);
    assert.match(serialized('capability.ai.assistant'), /SSE is the version 1 transport/i);
    assert.match(serialized('capability.ai.agentic-processes'), /target module independently authorizes/i);
    assert.match(serialized('capability.ai.partner-customization'), /own Axis\/assistant deployment/i);
});

test('business solution guides preserve domain ownership and deployment boundaries', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'solution.data-as-service.overview',
        'solution.backoffice.schema-workbench',
        'solution.backoffice.workspace-context',
        'solution.backoffice.technical-reference',
        'solution.learning-assessment.technical-reference',
        'solution.customer-reviews.technical-reference',
        'solution.kyc.technical-reference'
    ].forEach(code => assert.equal(byCode.has(code), true, code));

    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('solution.data-as-service.overview'), /not an unrestricted database endpoint/i);
    assert.match(serialized('solution.backoffice.schema-workbench'), /owning module CRUD\/search APIs/i);
    assert.match(serialized('solution.backoffice.schema-workbench'), /cross-module relationships/i);
    assert.match(serialized('solution.backoffice.workspace-context'), /One Axis deployment serves one customer project deployment/i);
    assert.match(serialized('solution.backoffice.technical-reference'), /Registry is persistent logical state plus expiring runtime presence/i);
    assert.match(serialized('solution.backoffice.technical-reference'), /calls CMS, Profile, CronJob, NEMS, DEAP, Assistant, and other modules directly/i);
    assert.match(serialized('solution.learning-assessment.technical-reference'), /application curriculum or frontend journeys/i);
    assert.match(serialized('solution.customer-reviews.technical-reference'), /do not write Product or customer identity records directly/i);
    assert.match(serialized('solution.kyc.technical-reference'), /Profile remains identity authority/i);
});

test('build guides preserve layered ownership, generation, documentation, and verification rules', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'build.application-capability',
        'build.apis',
        'build.customization',
        'build.testing',
        'build.documentation',
        'build.examples'
    ].forEach(code => assert.equal(byCode.has(code), true, code));

    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('build.application-capability'), /reus\w+ existing authorities first/i);
    assert.match(serialized('build.apis'), /unauthorized requests fail before controller or business execution/i);
    assert.match(serialized('build.apis'), /do not hand-edit generated output/i);
    assert.match(serialized('build.customization'), /Do not introduce a second loader, registry, configuration source, persistence path, workflow engine, or governance layer/i);
    assert.match(serialized('build.customization'), /application values out of package\.json/i);
    assert.match(serialized('build.testing'), /human login separately from module\/service and cron credentials/i);
    assert.match(serialized('build.testing'), /MonoServer/);
    assert.match(serialized('build.documentation'), /source\/pages is the canonical authored authority/i);
    assert.match(serialized('build.documentation'), /Temporary plans and action lists stay outside runtime documentation/i);
    assert.match(serialized('build.examples'), /call owning backend modules rather than placing business logic in the browser/i);
});

test('security guides preserve credential, browser, tenant, ownership, and shared-responsibility boundaries', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'security.identity-access',
        'security.browser',
        'security.shared-responsibility',
        'security.evidence',
        'capability.identity-access.technical-reference'
    ].forEach(code => assert.equal(byCode.has(code), true, code));

    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('security.identity-access'), /Service principal.*never signs in with a person's password/i);
    assert.match(serialized('security.identity-access'), /cannot broaden it/i);
    assert.match(serialized('security.browser'), /short-lived in-memory employee access tokens/i);
    assert.match(serialized('security.browser'), /exact allowed Origin/i);
    assert.match(serialized('security.browser'), /Locking is not logout/i);
    assert.match(serialized('security.shared-responsibility'), /passing local MonoServer test is not production certification/i);
    assert.match(serialized('security.evidence'), /absence of evidence is not a pass/i);
    assert.match(serialized('security.evidence'), /Never capture passwords, API keys, bearer\/refresh tokens/i);
    assert.match(serialized('capability.identity-access.technical-reference'), /Target module: route permission, schema action\/group access, fields, ownership/i);
    assert.match(serialized('capability.identity-access.technical-reference'), /Do not add a parallel identity store, token issuer, permission registry, session cache path/i);
});

test('operations guides preserve module activation, topology identity, lifecycle, and production qualification boundaries', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'operations.local-runtime',
        'operations.deployment',
        'operations.production',
        'operations.runtime-topology-reference'
    ].forEach(code => assert.equal(byCode.has(code), true, code));

    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('operations.local-runtime'), /activeModules decides what loads locally; servers\.\* provides endpoint coordinates and never activates/i);
    assert.match(serialized('operations.local-runtime'), /CMS staged and online use distinct systems or schemas/i);
    assert.match(serialized('operations.local-runtime'), /registers with BackOffice asynchronously/i);
    assert.match(serialized('operations.deployment'), /do not equate a fixed server list with module ownership/i);
    assert.match(serialized('operations.deployment'), /MonoServer results are not production evidence/i);
    assert.match(serialized('operations.production'), /OOM and SIGKILL cannot execute process hooks/i);
    assert.match(serialized('operations.production'), /specific cloud production environment is not certified by framework documentation alone/i);
    assert.match(serialized('operations.runtime-topology-reference'), /canonical runtime identity is derived from complete validated ancestry at runtime/i);
    assert.match(serialized('operations.runtime-topology-reference'), /Node management.*does not choose active modules or own business work/i);
    assert.match(serialized('operations.runtime-topology-reference'), /Internal node\/module communication uses governed service identity/i);
});

test('scheduled execution, event delivery, and publishing guides preserve their distinct authorities', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.scheduled-jobs.tutorial',
        'capability.events-messaging.architecture',
        'capability.content-publishing.tutorial'
    ].forEach(code => assert.equal(byCode.has(code), true, code));

    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('capability.scheduled-jobs.tutorial'), /CronJob owns when the approved Inventory handler runs; it does not reimplement reservation logic/i);
    assert.match(serialized('capability.scheduled-jobs.tutorial'), /Never store or reuse an employee username\/password/i);
    assert.match(serialized('capability.scheduled-jobs.tutorial'), /server only hosts active modules; CronJob remains module-owned/i);
    assert.match(serialized('capability.events-messaging.architecture'), /Publishers and listeners never import a broker client directly/i);
    assert.match(serialized('capability.events-messaging.architecture'), /stable typed\/versioned fact/i);
    assert.match(serialized('capability.events-messaging.architecture'), /event is evidence or a trigger, not an alternate persistence path/i);
    assert.match(serialized('capability.content-publishing.tutorial'), /Staged and Online run as different systems or schemas/i);
    assert.match(serialized('capability.content-publishing.tutorial'), /Workflow actions may be manual or automatic/i);
    assert.match(serialized('capability.content-publishing.tutorial'), /nPublish consumes the decision but never duplicates workflow state/i);
    assert.match(serialized('capability.content-publishing.tutorial'), /never writes the Online database directly/i);
});

test('final references preserve governance, terminology, licensing, module, and maturity contracts', () => {
    const byCode = new Map(pages.map(page => [page.code, page]));
    [
        'capability.observability-governance.technical-reference',
        'reference.glossary',
        'reference.licensing',
        'reference.modules',
        'reference.maturity'
    ].forEach(code => assert.equal(byCode.has(code), true, code));

    const serialized = code => JSON.stringify(byCode.get(code));
    assert.match(serialized('capability.observability-governance.technical-reference'), /never become configuration or mutation authorities/i);
    assert.match(serialized('capability.observability-governance.technical-reference'), /runtime governance does not become a second startup loader/i);
    assert.match(serialized('reference.glossary'), /server does not own the capabilities it hosts/i);
    assert.match(serialized('reference.glossary'), /root docs\/: temporary uncommitted planning\/checklist space/i);
    assert.match(serialized('reference.licensing'), /not legal advice and not an additional license grant/i);
    assert.match(serialized('reference.licensing'), /Third-party source.*must not be relabeled as Nodics-owned code/i);
    assert.match(serialized('reference.modules'), /defaultSampleService\.js is an optional module-creation placeholder only/i);
    assert.match(serialized('reference.modules'), /Runtime policy, permissions, navigation, endpoints, provider selection, limits, feature switches.*properties\.js, not package\.json/i);
    assert.match(serialized('reference.maturity'), /three independent questions/i);
    assert.match(serialized('reference.maturity'), /local MonoServer test is not production certification|MonoServer and Startio are local\/reference/i);
});

test('every registered canonical page has exactly one authored source page', () => {
    const registryDocument = JSON.parse(
        fs.readFileSync(path.join(root, 'source', 'canonical-pages.json'), 'utf8')
    );
    const registryPages = Array.isArray(registryDocument)
        ? registryDocument
        : registryDocument.pages;
    const registeredCodes = registryPages.map(page => page.code).sort();
    const authoredCodes = pages.map(page => page.code).sort();

    assert.equal(new Set(registeredCodes).size, registeredCodes.length);
    assert.equal(new Set(authoredCodes).size, authoredCodes.length);
    assert.deepEqual(authoredCodes, registeredCodes);
});
