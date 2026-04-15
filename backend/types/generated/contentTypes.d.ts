import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::api-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    deviceId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    userId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'admin::transfer-token-permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> &
      Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAdminNoteAdminNote extends Struct.CollectionTypeSchema {
  collectionName: 'admin_notes';
  info: {
    description: 'Notes internes du panneau admin';
    displayName: 'Note Admin';
    pluralName: 'admin-notes';
    singularName: 'admin-note';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    body: Schema.Attribute.RichText;
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<''>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::admin-note.admin-note'
    > &
      Schema.Attribute.Private;
    pinned: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    publishedAt: Schema.Attribute.DateTime;
    title: Schema.Attribute.String & Schema.Attribute.DefaultTo<''>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiArtistEditRequestArtistEditRequest
  extends Struct.CollectionTypeSchema {
  collectionName: 'artist_edit_requests';
  info: {
    description: 'Demandes de modification de contenu par les artistes';
    displayName: 'Artist Edit Request';
    pluralName: 'artist-edit-requests';
    singularName: 'artist-edit-request';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    adminNotes: Schema.Attribute.Text;
    artistName: Schema.Attribute.String;
    artistSlug: Schema.Attribute.String & Schema.Attribute.Required;
    changeData: Schema.Attribute.JSON & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    linkedMessageId: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::artist-edit-request.artist-edit-request'
    > &
      Schema.Attribute.Private;
    processedAt: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    requestType: Schema.Attribute.Enumeration<
      [
        'add-prints',
        'remove-prints',
        'add-stickers',
        'remove-stickers',
        'add-merch',
        'remove-merch',
        'update-profile',
        'update-bio',
        'update-socials',
        'update-avatar',
        'mark-unique',
        'unmark-unique',
        'rename-item',
      ]
    > &
      Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['pending', 'approved', 'rejected']> &
      Schema.Attribute.DefaultTo<'pending'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiArtistMessageArtistMessage
  extends Struct.CollectionTypeSchema {
  collectionName: 'artist_messages';
  info: {
    description: 'Messages des artistes vers Massive';
    displayName: 'Artist Message';
    pluralName: 'artist-messages';
    singularName: 'artist-message';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    adminReply: Schema.Attribute.Text;
    artistName: Schema.Attribute.String;
    artistRepliedAt: Schema.Attribute.DateTime;
    artistReply: Schema.Attribute.Text;
    artistSlug: Schema.Attribute.String & Schema.Attribute.Required;
    attachments: Schema.Attribute.JSON;
    category: Schema.Attribute.Enumeration<
      [
        'new-images',
        'question',
        'withdrawal',
        'update-profile',
        'edit-request',
        'other',
      ]
    > &
      Schema.Attribute.DefaultTo<'other'>;
    conversationId: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::artist-message.artist-message'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    repliedAt: Schema.Attribute.DateTime;
    senderEmail: Schema.Attribute.Email;
    senderName: Schema.Attribute.String;
    senderType: Schema.Attribute.Enumeration<['artist', 'public', 'admin']> &
      Schema.Attribute.DefaultTo<'artist'>;
    status: Schema.Attribute.Enumeration<
      ['new', 'read', 'replied', 'archived']
    > &
      Schema.Attribute.DefaultTo<'new'>;
    subject: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiArtistPaymentArtistPayment
  extends Struct.CollectionTypeSchema {
  collectionName: 'artist_payments';
  info: {
    description: 'Paiements verses aux artistes';
    displayName: 'Paiement artiste';
    pluralName: 'artist-payments';
    singularName: 'artist-payment';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    artist: Schema.Attribute.Relation<'manyToOne', 'api::artist.artist'>;
    artistName: Schema.Attribute.String & Schema.Attribute.Required;
    artistSlug: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::artist-payment.artist-payment'
    > &
      Schema.Attribute.Private;
    method: Schema.Attribute.Enumeration<
      ['interac', 'cash', 'cheque', 'other']
    > &
      Schema.Attribute.DefaultTo<'interac'>;
    notes: Schema.Attribute.Text;
    period: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiArtistSubmissionArtistSubmission
  extends Struct.CollectionTypeSchema {
  collectionName: 'artist_submissions';
  info: {
    description: 'Soumissions de partenariat artiste';
    displayName: 'Soumission Artiste';
    pluralName: 'artist-submissions';
    singularName: 'artist-submission';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    adresse: Schema.Attribute.Text & Schema.Attribute.Required;
    bio: Schema.Attribute.Text;
    contractAccepted: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    contractVersion: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::artist-submission.artist-submission'
    > &
      Schema.Attribute.Private;
    nomArtiste: Schema.Attribute.String;
    nomLegal: Schema.Attribute.String & Schema.Attribute.Required;
    notes: Schema.Attribute.Text;
    photoProfilUrl: Schema.Attribute.String;
    portfolioUrls: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['new', 'reviewing', 'accepted', 'rejected', 'archived']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'new'>;
    telephone: Schema.Attribute.String & Schema.Attribute.Required;
    tpsTvq: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiArtistArtist extends Struct.CollectionTypeSchema {
  collectionName: 'artists';
  info: {
    description: 'Artistes et leurs prints (boutique artistes)';
    displayName: 'Artiste';
    pluralName: 'artists';
    singularName: 'artist';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    avatar: Schema.Attribute.Media<'images'>;
    bioEn: Schema.Attribute.Text;
    bioEs: Schema.Attribute.Text;
    bioFr: Schema.Attribute.Text;
    commissionRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0.5>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    demarcheEn: Schema.Attribute.JSON;
    demarcheEs: Schema.Attribute.JSON;
    demarcheFr: Schema.Attribute.JSON;
    email: Schema.Attribute.Email;
    heroImage: Schema.Attribute.Media<'images'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::artist.artist'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    pricing: Schema.Attribute.JSON;
    printImages: Schema.Attribute.Media<'images', true>;
    prints: Schema.Attribute.JSON;
    productionCosts: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    socials: Schema.Attribute.JSON;
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    stickers: Schema.Attribute.JSON;
    taglineEn: Schema.Attribute.String;
    taglineEs: Schema.Attribute.String;
    taglineFr: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiBoutiqueItemBoutiqueItem
  extends Struct.CollectionTypeSchema {
  collectionName: 'boutique_items';
  info: {
    description: 'Cartes affichees sur la page Boutique';
    displayName: 'Carte Boutique';
    pluralName: 'boutique-items';
    singularName: 'boutique-item';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    hasCart: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    image: Schema.Attribute.Media<'images'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::boutique-item.boutique-item'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    serviceKey: Schema.Attribute.String;
    slug: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    startingPrice: Schema.Attribute.Decimal;
    subtitleEn: Schema.Attribute.String;
    subtitleEs: Schema.Attribute.String;
    subtitleFr: Schema.Attribute.String;
    titleEn: Schema.Attribute.String & Schema.Attribute.Required;
    titleEs: Schema.Attribute.String;
    titleFr: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiCalendarEventCalendarEvent
  extends Struct.CollectionTypeSchema {
  collectionName: 'calendar_events';
  info: {
    description: 'Evenements du calendrier tatoueur';
    displayName: 'Evenement Calendrier';
    pluralName: 'calendar-events';
    singularName: 'calendar-event';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#FFCC02'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    endTime: Schema.Attribute.DateTime & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::calendar-event.calendar-event'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    reservation: Schema.Attribute.Relation<
      'manyToOne',
      'api::reservation.reservation'
    >;
    startTime: Schema.Attribute.DateTime & Schema.Attribute.Required;
    tatoueur: Schema.Attribute.Relation<'manyToOne', 'api::tatoueur.tatoueur'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['rendez-vous', 'flash-day', 'conge', 'personnel', 'bloque']
    > &
      Schema.Attribute.DefaultTo<'rendez-vous'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiClientClient extends Struct.CollectionTypeSchema {
  collectionName: 'clients';
  info: {
    description: 'CRM \u2014 Fiches clients avec historique et notes';
    displayName: 'Client';
    pluralName: 'clients';
    singularName: 'client';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    avatar: Schema.Attribute.Media<'images'>;
    company: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    files: Schema.Attribute.Media<'images' | 'files', true>;
    lastOrderDate: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::client.client'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    notesEn: Schema.Attribute.Text;
    notesFr: Schema.Attribute.Text;
    orderCount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    orders: Schema.Attribute.Relation<'oneToMany', 'api::order.order'>;
    phone: Schema.Attribute.String;
    preferredStyles: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    savedFlashs: Schema.Attribute.JSON;
    supabaseUserId: Schema.Attribute.String;
    tags: Schema.Attribute.JSON;
    totalSpent: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiContactSubmissionContactSubmission
  extends Struct.CollectionTypeSchema {
  collectionName: 'contact_submissions';
  info: {
    description: 'Messages recus via le formulaire de contact';
    displayName: 'Message Contact';
    pluralName: 'contact-submissions';
    singularName: 'contact-submission';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    budget: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    entreprise: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::contact-submission.contact-submission'
    > &
      Schema.Attribute.Private;
    message: Schema.Attribute.Text & Schema.Attribute.Required;
    nom: Schema.Attribute.String & Schema.Attribute.Required;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    service: Schema.Attribute.String;
    status: Schema.Attribute.Enumeration<
      ['new', 'read', 'replied', 'archived']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'new'>;
    telephone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    urgence: Schema.Attribute.String;
  };
}

export interface ApiExpenseExpense extends Struct.CollectionTypeSchema {
  collectionName: 'expenses';
  info: {
    description: 'Depenses et comptabilite';
    displayName: 'Depense';
    pluralName: 'expenses';
    singularName: 'expense';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    category: Schema.Attribute.Enumeration<
      [
        'consommables',
        'materiel',
        'shipping',
        'software',
        'marketing',
        'equipment',
        'taxes',
        'other',
      ]
    > &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    description: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::expense.expense'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    receipt: Schema.Attribute.Media<'images' | 'files'>;
    receiptNumber: Schema.Attribute.String;
    receiptUrl: Schema.Attribute.String;
    taxDeductible: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    tpsAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    tvqAmount: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    vendor: Schema.Attribute.String;
  };
}

export interface ApiFlashFlash extends Struct.CollectionTypeSchema {
  collectionName: 'flashs';
  info: {
    description: 'Dessins de tatouage (flashs)';
    displayName: 'Flash Tattoo';
    pluralName: 'flashs';
    singularName: 'flash';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    approved: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    bodyPlacement: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descriptionEn: Schema.Attribute.Text;
    descriptionFr: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    isUnique: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::flash.flash'> &
      Schema.Attribute.Private;
    pricePrint: Schema.Attribute.Integer;
    priceTattoo: Schema.Attribute.Integer;
    printAvailable: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    publishedAt: Schema.Attribute.DateTime;
    size: Schema.Attribute.Enumeration<
      ['petit', 'moyen', 'grand', 'tres-grand']
    > &
      Schema.Attribute.DefaultTo<'moyen'>;
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    status: Schema.Attribute.Enumeration<['disponible', 'reserve', 'tatoue']> &
      Schema.Attribute.DefaultTo<'disponible'>;
    style: Schema.Attribute.String;
    tatoueur: Schema.Attribute.Relation<'manyToOne', 'api::tatoueur.tatoueur'>;
    titleEn: Schema.Attribute.String;
    titleFr: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    visible: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
  };
}

export interface ApiInventoryItemInventoryItem
  extends Struct.CollectionTypeSchema {
  collectionName: 'inventory_items';
  info: {
    description: "Gestion d'inventaire \u2014 textiles, cadres, accessoires, produits";
    displayName: 'Inventaire';
    pluralName: 'inventory-items';
    singularName: 'inventory-item';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    brand: Schema.Attribute.String;
    category: Schema.Attribute.Enumeration<
      [
        'textile',
        'frame',
        'sticker',
        'merch',
        'equipment',
        'consommable',
        'emballage',
      ]
    > &
      Schema.Attribute.Required;
    color: Schema.Attribute.String;
    costPrice: Schema.Attribute.Decimal;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    detail: Schema.Attribute.String;
    hasZip: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    image: Schema.Attribute.Media<'images'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::inventory-item.inventory-item'
    > &
      Schema.Attribute.Private;
    location: Schema.Attribute.String;
    lowStockThreshold: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<5>;
    nameEn: Schema.Attribute.String & Schema.Attribute.Required;
    nameFr: Schema.Attribute.String & Schema.Attribute.Required;
    notes: Schema.Attribute.Text;
    product: Schema.Attribute.Relation<'manyToOne', 'api::product.product'>;
    publishedAt: Schema.Attribute.DateTime;
    quantity: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<0>;
    reserved: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    sku: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    variant: Schema.Attribute.String;
  };
}

export interface ApiInvoiceInvoice extends Struct.CollectionTypeSchema {
  collectionName: 'invoices';
  info: {
    description: 'Factures clients (manuelles et automatiques)';
    displayName: 'Facture';
    pluralName: 'invoices';
    singularName: 'invoice';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    customerAddress: Schema.Attribute.Text;
    customerEmail: Schema.Attribute.Email;
    customerName: Schema.Attribute.String & Schema.Attribute.Required;
    customerPhone: Schema.Attribute.String;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    discountAmount: Schema.Attribute.Decimal;
    discountPercent: Schema.Attribute.Decimal;
    includeOwnerName: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    invoiceNumber: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    items: Schema.Attribute.JSON & Schema.Attribute.Required;
    lang: Schema.Attribute.Enumeration<['fr', 'en']> &
      Schema.Attribute.DefaultTo<'fr'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::invoice.invoice'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    order: Schema.Attribute.Relation<'oneToOne', 'api::order.order'>;
    paidAt: Schema.Attribute.DateTime;
    pdfFileId: Schema.Attribute.String;
    pdfUrl: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['draft', 'sent', 'paid', 'cancelled']
    > &
      Schema.Attribute.DefaultTo<'draft'>;
    subtotal: Schema.Attribute.Decimal & Schema.Attribute.Required;
    total: Schema.Attribute.Decimal & Schema.Attribute.Required;
    tps: Schema.Attribute.Decimal;
    tvq: Schema.Attribute.Decimal;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiNewsArticleNewsArticle extends Struct.CollectionTypeSchema {
  collectionName: 'news_articles';
  info: {
    description: 'Articles de nouvelles et annonces';
    displayName: 'Actualite';
    pluralName: 'news-articles';
    singularName: 'news-article';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      ['announcement', 'blog', 'promo', 'update']
    > &
      Schema.Attribute.DefaultTo<'announcement'>;
    contentEn: Schema.Attribute.RichText & Schema.Attribute.Required;
    contentEs: Schema.Attribute.RichText;
    contentFr: Schema.Attribute.RichText & Schema.Attribute.Required;
    coverImage: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    excerptEn: Schema.Attribute.Text;
    excerptEs: Schema.Attribute.Text;
    excerptFr: Schema.Attribute.Text;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::news-article.news-article'
    > &
      Schema.Attribute.Private;
    pinned: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'titleEn'>;
    titleEn: Schema.Attribute.String & Schema.Attribute.Required;
    titleEs: Schema.Attribute.String;
    titleFr: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiOrderOrder extends Struct.CollectionTypeSchema {
  collectionName: 'orders';
  info: {
    description: 'Commandes clients avec paiement Stripe';
    displayName: 'Commande';
    pluralName: 'orders';
    singularName: 'order';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    carrier: Schema.Attribute.Enumeration<
      ['postes-canada', 'purolator', 'ups', 'autre']
    > &
      Schema.Attribute.DefaultTo<'postes-canada'>;
    client: Schema.Attribute.Relation<'manyToOne', 'api::client.client'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currency: Schema.Attribute.String & Schema.Attribute.DefaultTo<'cad'>;
    customerEmail: Schema.Attribute.Email & Schema.Attribute.Required;
    customerName: Schema.Attribute.String & Schema.Attribute.Required;
    customerPhone: Schema.Attribute.String;
    designReady: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    files: Schema.Attribute.Media<'images' | 'files', true>;
    invoiceNumber: Schema.Attribute.String & Schema.Attribute.Unique;
    items: Schema.Attribute.JSON & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::order.order'> &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    promoCode: Schema.Attribute.String;
    promoDiscount: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    shipping: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    shippingAddress: Schema.Attribute.JSON;
    status: Schema.Attribute.Enumeration<
      [
        'draft',
        'pending',
        'paid',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
        'refunded',
      ]
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    stripePaymentIntentId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    subtotal: Schema.Attribute.Integer & Schema.Attribute.Required;
    supabaseUserId: Schema.Attribute.String;
    total: Schema.Attribute.Integer & Schema.Attribute.Required;
    totalWeight: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    tps: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    trackingNumber: Schema.Attribute.String;
    tvq: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiProductProduct extends Struct.CollectionTypeSchema {
  collectionName: 'products';
  info: {
    description: 'Produits, tarifs et configurateurs';
    displayName: 'Produit';
    pluralName: 'products';
    singularName: 'product';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    category: Schema.Attribute.Enumeration<
      [
        'stickers',
        'fine-art',
        'sublimation',
        'flyers',
        'design',
        'web',
        'pret-a-porter',
        'sticker-pack',
        'merch-tshirt',
        'merch-hoodie',
        'merch-longsleeve',
        'merch-crewneck',
        'merch-totebag',
      ]
    > &
      Schema.Attribute.Required;
    comingSoon: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descriptionEn: Schema.Attribute.RichText;
    descriptionEs: Schema.Attribute.RichText;
    descriptionFr: Schema.Attribute.RichText;
    faqEn: Schema.Attribute.JSON;
    faqEs: Schema.Attribute.JSON;
    faqFr: Schema.Attribute.JSON;
    highlightsEn: Schema.Attribute.JSON;
    highlightsEs: Schema.Attribute.JSON;
    highlightsFr: Schema.Attribute.JSON;
    images: Schema.Attribute.Media<'images', true>;
    imageUrl: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::product.product'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    nameEn: Schema.Attribute.String & Schema.Attribute.Required;
    nameEs: Schema.Attribute.String;
    nameFr: Schema.Attribute.String & Schema.Attribute.Required;
    pricingData: Schema.Attribute.JSON & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiPromoCodePromoCode extends Struct.CollectionTypeSchema {
  collectionName: 'promo_codes';
  info: {
    description: 'Codes promotionnels avec gestion admin';
    displayName: 'Code Promo';
    pluralName: 'promo-codes';
    singularName: 'promo-code';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    currentUses: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    discountPercent: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 1;
        },
        number
      >;
    expiresAt: Schema.Attribute.DateTime;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::promo-code.promo-code'
    > &
      Schema.Attribute.Private;
    maxUses: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiReservationReservation extends Struct.CollectionTypeSchema {
  collectionName: 'reservations';
  info: {
    description: 'Reservations de flash pour tatouage';
    displayName: 'Reservation Tattoo';
    pluralName: 'reservations';
    singularName: 'reservation';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    budget: Schema.Attribute.String;
    client: Schema.Attribute.Relation<'manyToOne', 'api::client.client'>;
    clientEmail: Schema.Attribute.Email & Schema.Attribute.Required;
    clientName: Schema.Attribute.String & Schema.Attribute.Required;
    clientPhone: Schema.Attribute.String;
    confirmedDate: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    flash: Schema.Attribute.Relation<'manyToOne', 'api::flash.flash'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::reservation.reservation'
    > &
      Schema.Attribute.Private;
    messageDuClient: Schema.Attribute.Text;
    notes: Schema.Attribute.Text;
    placement: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    referenceImages: Schema.Attribute.Media<'images', true>;
    requestedDate: Schema.Attribute.Date;
    size: Schema.Attribute.String;
    status: Schema.Attribute.Enumeration<
      ['demandee', 'confirmee', 'planifiee', 'realisee', 'annulee']
    > &
      Schema.Attribute.DefaultTo<'demandee'>;
    supabaseUserId: Schema.Attribute.String;
    tatoueur: Schema.Attribute.Relation<'manyToOne', 'api::tatoueur.tatoueur'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiServicePackageServicePackage
  extends Struct.CollectionTypeSchema {
  collectionName: 'service_packages';
  info: {
    description: 'Forfaits de services (Pack Artiste, Pack \u00C9v\u00E9nement, etc.)';
    displayName: 'Forfait';
    pluralName: 'service-packages';
    singularName: 'service-package';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ctaType: Schema.Attribute.Enumeration<['price', 'quote']> &
      Schema.Attribute.DefaultTo<'price'>;
    descriptionEn: Schema.Attribute.Text;
    descriptionEs: Schema.Attribute.Text;
    descriptionFr: Schema.Attribute.Text;
    items: Schema.Attribute.JSON & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::service-package.service-package'
    > &
      Schema.Attribute.Private;
    nameEn: Schema.Attribute.String & Schema.Attribute.Required;
    nameEs: Schema.Attribute.String;
    nameFr: Schema.Attribute.String & Schema.Attribute.Required;
    popular: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    priceEn: Schema.Attribute.String & Schema.Attribute.Required;
    priceEs: Schema.Attribute.String;
    priceFr: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiServicePageServicePage extends Struct.CollectionTypeSchema {
  collectionName: 'service_pages';
  info: {
    description: 'Pages de services editables (Prints, Stickers, Merch, Design)';
    displayName: 'Page Service';
    pluralName: 'service-pages';
    singularName: 'service-page';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    boutiqueSlug: Schema.Attribute.String;
    comparisonEn: Schema.Attribute.JSON;
    comparisonEs: Schema.Attribute.JSON;
    comparisonFr: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    descriptionEn: Schema.Attribute.RichText;
    descriptionEs: Schema.Attribute.RichText;
    descriptionFr: Schema.Attribute.RichText;
    equipmentEn: Schema.Attribute.JSON;
    equipmentEs: Schema.Attribute.JSON;
    equipmentFr: Schema.Attribute.JSON;
    faqEn: Schema.Attribute.JSON;
    faqEs: Schema.Attribute.JSON;
    faqFr: Schema.Attribute.JSON;
    gallery: Schema.Attribute.Media<'images', true>;
    heroImage: Schema.Attribute.Media<'images'>;
    highlightsEn: Schema.Attribute.JSON;
    highlightsEs: Schema.Attribute.JSON;
    highlightsFr: Schema.Attribute.JSON;
    iconName: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::service-page.service-page'
    > &
      Schema.Attribute.Private;
    pricingEn: Schema.Attribute.JSON;
    pricingEs: Schema.Attribute.JSON;
    pricingFr: Schema.Attribute.JSON;
    processEn: Schema.Attribute.JSON;
    processEs: Schema.Attribute.JSON;
    processFr: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    seo: Schema.Attribute.Component<'shared.seo-meta', false>;
    slug: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    subtitleEn: Schema.Attribute.Text;
    subtitleEs: Schema.Attribute.Text;
    subtitleFr: Schema.Attribute.Text;
    teamEn: Schema.Attribute.JSON;
    teamEs: Schema.Attribute.JSON;
    teamFr: Schema.Attribute.JSON;
    technologiesEn: Schema.Attribute.JSON;
    technologiesEs: Schema.Attribute.JSON;
    technologiesFr: Schema.Attribute.JSON;
    titleEn: Schema.Attribute.String & Schema.Attribute.Required;
    titleEs: Schema.Attribute.String;
    titleFr: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    webProjectImages: Schema.Attribute.Media<'images', true>;
    webProjectsEn: Schema.Attribute.JSON;
    webProjectsEs: Schema.Attribute.JSON;
    webProjectsFr: Schema.Attribute.JSON;
    whatWeDeliverEn: Schema.Attribute.JSON;
    whatWeDeliverEs: Schema.Attribute.JSON;
    whatWeDeliverFr: Schema.Attribute.JSON;
  };
}

export interface ApiSiteContentSiteContent extends Struct.SingleTypeSchema {
  collectionName: 'site_contents';
  info: {
    description: 'Tout le contenu editable du site par section';
    displayName: 'Contenu du Site';
    pluralName: 'site-contents';
    singularName: 'site-content';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    aboutEquipment: Schema.Attribute.Component<'about.equipment-item', true>;
    aboutEquipmentImages: Schema.Attribute.Media<'images', true>;
    aboutEquipmentTitleEn: Schema.Attribute.String;
    aboutEquipmentTitleEs: Schema.Attribute.String;
    aboutEquipmentTitleFr: Schema.Attribute.String;
    aboutHeroSubtitleEn: Schema.Attribute.Text;
    aboutHeroSubtitleEs: Schema.Attribute.Text;
    aboutHeroSubtitleFr: Schema.Attribute.Text;
    aboutHeroTitleEn: Schema.Attribute.String;
    aboutHeroTitleEs: Schema.Attribute.String;
    aboutHeroTitleFr: Schema.Attribute.String;
    aboutHistoryImages: Schema.Attribute.Media<'images', true>;
    aboutHistoryTitleEn: Schema.Attribute.String;
    aboutHistoryTitleEs: Schema.Attribute.String;
    aboutHistoryTitleFr: Schema.Attribute.String;
    aboutSeo: Schema.Attribute.Component<'shared.seo-meta', false>;
    aboutSpaceDescriptionEn: Schema.Attribute.Text;
    aboutSpaceDescriptionEs: Schema.Attribute.Text;
    aboutSpaceDescriptionFr: Schema.Attribute.Text;
    aboutSpaceImage: Schema.Attribute.Media<'images'>;
    aboutSpaceLocationEn: Schema.Attribute.String;
    aboutSpaceLocationEs: Schema.Attribute.String;
    aboutSpaceLocationFr: Schema.Attribute.String;
    aboutSpaceTitleEn: Schema.Attribute.String;
    aboutSpaceTitleEs: Schema.Attribute.String;
    aboutSpaceTitleFr: Schema.Attribute.String;
    aboutTeam: Schema.Attribute.Component<'about.team-member', true>;
    aboutTeamTitleEn: Schema.Attribute.String;
    aboutTeamTitleEs: Schema.Attribute.String;
    aboutTeamTitleFr: Schema.Attribute.String;
    aboutTextEn: Schema.Attribute.RichText;
    aboutTextEs: Schema.Attribute.RichText;
    aboutTextFr: Schema.Attribute.RichText;
    aboutTimeline: Schema.Attribute.Component<'about.timeline-event', true>;
    aboutTimelineTitleEn: Schema.Attribute.String;
    aboutTimelineTitleEs: Schema.Attribute.String;
    aboutTimelineTitleFr: Schema.Attribute.String;
    aboutUniverse: Schema.Attribute.Component<'about.universe-project', true>;
    aboutUniverseTitleEn: Schema.Attribute.String;
    aboutUniverseTitleEs: Schema.Attribute.String;
    aboutUniverseTitleFr: Schema.Attribute.String;
    advantages: Schema.Attribute.Component<'home.advantage', true>;
    advantagesTitleEn: Schema.Attribute.String;
    advantagesTitleEs: Schema.Attribute.String;
    advantagesTitleFr: Schema.Attribute.String;
    announcementActive: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    announcementEn: Schema.Attribute.String;
    announcementEs: Schema.Attribute.String;
    announcementFr: Schema.Attribute.String;
    contactEmail: Schema.Attribute.Email;
    contactPageSubtitleEn: Schema.Attribute.Text;
    contactPageSubtitleEs: Schema.Attribute.Text;
    contactPageSubtitleFr: Schema.Attribute.Text;
    contactPageTitleEn: Schema.Attribute.String;
    contactPageTitleEs: Schema.Attribute.String;
    contactPageTitleFr: Schema.Attribute.String;
    contactPhone: Schema.Attribute.String;
    contactSeo: Schema.Attribute.Component<'shared.seo-meta', false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ctaBackgroundImage: Schema.Attribute.Media<'images'>;
    ctaButtonEn: Schema.Attribute.String;
    ctaButtonEs: Schema.Attribute.String;
    ctaButtonFr: Schema.Attribute.String;
    ctaSubtitleEn: Schema.Attribute.Text;
    ctaSubtitleEs: Schema.Attribute.Text;
    ctaSubtitleFr: Schema.Attribute.Text;
    ctaTitleEn: Schema.Attribute.String;
    ctaTitleEs: Schema.Attribute.String;
    ctaTitleFr: Schema.Attribute.String;
    featuredProjects: Schema.Attribute.Component<'home.featured-project', true>;
    footerLocationEn: Schema.Attribute.String;
    footerLocationEs: Schema.Attribute.String;
    footerLocationFr: Schema.Attribute.String;
    footerStudioDescEn: Schema.Attribute.Text;
    footerStudioDescEs: Schema.Attribute.Text;
    footerStudioDescFr: Schema.Attribute.Text;
    footerTaglineEn: Schema.Attribute.String;
    footerTaglineEs: Schema.Attribute.String;
    footerTaglineFr: Schema.Attribute.String;
    heroCta1En: Schema.Attribute.String;
    heroCta1Es: Schema.Attribute.String;
    heroCta1Fr: Schema.Attribute.String;
    heroCta2En: Schema.Attribute.String;
    heroCta2Es: Schema.Attribute.String;
    heroCta2Fr: Schema.Attribute.String;
    heroImages: Schema.Attribute.Media<'images', true>;
    heroServicesEn: Schema.Attribute.String;
    heroServicesEs: Schema.Attribute.String;
    heroServicesFr: Schema.Attribute.String;
    heroSubtitleEn: Schema.Attribute.Text;
    heroSubtitleEs: Schema.Attribute.Text;
    heroSubtitleFr: Schema.Attribute.Text;
    heroTaglineEn: Schema.Attribute.String;
    heroTaglineEs: Schema.Attribute.String;
    heroTaglineFr: Schema.Attribute.String;
    homeSeo: Schema.Attribute.Component<'shared.seo-meta', false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::site-content.site-content'
    > &
      Schema.Attribute.Private;
    newsletterFormEndpoint: Schema.Attribute.String;
    projectsSectionSubtitleEn: Schema.Attribute.Text;
    projectsSectionSubtitleEs: Schema.Attribute.Text;
    projectsSectionSubtitleFr: Schema.Attribute.Text;
    projectsSectionTitleEn: Schema.Attribute.String;
    projectsSectionTitleEs: Schema.Attribute.String;
    projectsSectionTitleFr: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    serviceCards: Schema.Attribute.Component<'home.service-card', true>;
    servicesSectionSubtitleEn: Schema.Attribute.Text;
    servicesSectionSubtitleEs: Schema.Attribute.Text;
    servicesSectionSubtitleFr: Schema.Attribute.Text;
    servicesSectionTitleEn: Schema.Attribute.String;
    servicesSectionTitleEs: Schema.Attribute.String;
    servicesSectionTitleFr: Schema.Attribute.String;
    socialLinks: Schema.Attribute.Component<'footer.social-link', true>;
    stats: Schema.Attribute.Component<'home.stat-item', true>;
    testimonials: Schema.Attribute.Component<'home.testimonial', true>;
    testimonialsTitleEn: Schema.Attribute.String;
    testimonialsTitleEs: Schema.Attribute.String;
    testimonialsTitleFr: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTatoueurTatoueur extends Struct.CollectionTypeSchema {
  collectionName: 'tatoueurs';
  info: {
    description: 'Artistes tatoueurs partenaires';
    displayName: 'Tatoueur';
    pluralName: 'tatoueurs';
    singularName: 'tatoueur';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    active: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    approved: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    avatar: Schema.Attribute.Media<'images'>;
    bioEn: Schema.Attribute.Text;
    bioFr: Schema.Attribute.Text;
    calendarSettings: Schema.Attribute.JSON;
    city: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    discountRate: Schema.Attribute.Decimal & Schema.Attribute.DefaultTo<0.3>;
    email: Schema.Attribute.Email;
    featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    flashs: Schema.Attribute.Relation<'oneToMany', 'api::flash.flash'>;
    heroImage: Schema.Attribute.Media<'images'>;
    hourlyRate: Schema.Attribute.Integer;
    instagramHandle: Schema.Attribute.String;
    links: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::tatoueur.tatoueur'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    pageViews: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    priceTattooMin: Schema.Attribute.Integer;
    publishedAt: Schema.Attribute.DateTime;
    realisationImages: Schema.Attribute.Media<'images', true>;
    slug: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    socials: Schema.Attribute.JSON;
    sortOrder: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<0>;
    studio: Schema.Attribute.String;
    styles: Schema.Attribute.JSON;
    supabaseUserId: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTattooMessageTattooMessage
  extends Struct.CollectionTypeSchema {
  collectionName: 'tattoo_messages';
  info: {
    description: 'Messages entre clients et tatoueurs';
    displayName: 'Message Tatoueur';
    pluralName: 'tattoo-messages';
    singularName: 'tattoo-message';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    attachments: Schema.Attribute.Media<'images', true>;
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    conversationId: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::tattoo-message.tattoo-message'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    readByRecipient: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    relatedFlash: Schema.Attribute.Relation<'manyToOne', 'api::flash.flash'>;
    relatedReservation: Schema.Attribute.Relation<
      'manyToOne',
      'api::reservation.reservation'
    >;
    senderEmail: Schema.Attribute.Email & Schema.Attribute.Required;
    senderName: Schema.Attribute.String & Schema.Attribute.Required;
    senderType: Schema.Attribute.Enumeration<['client', 'tatoueur', 'admin']> &
      Schema.Attribute.DefaultTo<'client'>;
    status: Schema.Attribute.Enumeration<
      ['new', 'read', 'replied', 'archived']
    > &
      Schema.Attribute.DefaultTo<'new'>;
    supabaseUserId: Schema.Attribute.String;
    tatoueur: Schema.Attribute.Relation<'manyToOne', 'api::tatoueur.tatoueur'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiTestimonialTestimonial extends Struct.CollectionTypeSchema {
  collectionName: 'testimonials';
  info: {
    description: 'Temoignages clients recus apres une commande';
    displayName: 'Temoignage';
    pluralName: 'testimonials';
    singularName: 'testimonial';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    approved: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    client: Schema.Attribute.Relation<'manyToOne', 'api::client.client'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    featured: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::testimonial.testimonial'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    order: Schema.Attribute.Relation<'manyToOne', 'api::order.order'>;
    publishedAt: Schema.Attribute.DateTime;
    rating: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 5;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<5>;
    roleEn: Schema.Attribute.String;
    roleFr: Schema.Attribute.String;
    textEn: Schema.Attribute.Text;
    textFr: Schema.Attribute.Text & Schema.Attribute.Required;
    token: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiUserRoleUserRole extends Struct.CollectionTypeSchema {
  collectionName: 'user_roles';
  info: {
    description: 'Gestion des roles utilisateurs (user, artist)';
    displayName: 'User Role';
    pluralName: 'user-roles';
    singularName: 'user-role';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    artistSlug: Schema.Attribute.String;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    displayName: Schema.Attribute.String;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    heroImageId: Schema.Attribute.String;
    itemRenames: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::user-role.user-role'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Enumeration<['user', 'artist', 'tatoueur']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'user'>;
    supabaseUserId: Schema.Attribute.String;
    tatoueurSlug: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface ApiWithdrawalRequestWithdrawalRequest
  extends Struct.CollectionTypeSchema {
  collectionName: 'withdrawal_requests';
  info: {
    description: 'Demandes de retrait PayPal des artistes';
    displayName: 'Withdrawal Request';
    pluralName: 'withdrawal-requests';
    singularName: 'withdrawal-request';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    adminNotes: Schema.Attribute.Text;
    amount: Schema.Attribute.Decimal & Schema.Attribute.Required;
    artistName: Schema.Attribute.String;
    artistSlug: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::withdrawal-request.withdrawal-request'
    > &
      Schema.Attribute.Private;
    notes: Schema.Attribute.Text;
    paypalEmail: Schema.Attribute.Email & Schema.Attribute.Required;
    paypalTransactionId: Schema.Attribute.String;
    processedAt: Schema.Attribute.DateTime;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['pending', 'processing', 'completed', 'rejected']
    > &
      Schema.Attribute.DefaultTo<'pending'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesRelease
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<
      ['ready', 'blocked', 'failed', 'done', 'empty']
    > &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::content-releases.release'
    >;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::i18n.locale'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage
  extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::review-workflows.workflow'
    >;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    focalPoint: Schema.Attribute.JSON;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.file'
    > &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::upload.folder'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.role'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.permission'
    >;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    users: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    >;
  };
}

export interface PluginUsersPermissionsUser
  extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::users-permissions.user'
    > &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<
      'manyToOne',
      'plugin::users-permissions.role'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> &
      Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::admin-note.admin-note': ApiAdminNoteAdminNote;
      'api::artist-edit-request.artist-edit-request': ApiArtistEditRequestArtistEditRequest;
      'api::artist-message.artist-message': ApiArtistMessageArtistMessage;
      'api::artist-payment.artist-payment': ApiArtistPaymentArtistPayment;
      'api::artist-submission.artist-submission': ApiArtistSubmissionArtistSubmission;
      'api::artist.artist': ApiArtistArtist;
      'api::boutique-item.boutique-item': ApiBoutiqueItemBoutiqueItem;
      'api::calendar-event.calendar-event': ApiCalendarEventCalendarEvent;
      'api::client.client': ApiClientClient;
      'api::contact-submission.contact-submission': ApiContactSubmissionContactSubmission;
      'api::expense.expense': ApiExpenseExpense;
      'api::flash.flash': ApiFlashFlash;
      'api::inventory-item.inventory-item': ApiInventoryItemInventoryItem;
      'api::invoice.invoice': ApiInvoiceInvoice;
      'api::news-article.news-article': ApiNewsArticleNewsArticle;
      'api::order.order': ApiOrderOrder;
      'api::product.product': ApiProductProduct;
      'api::promo-code.promo-code': ApiPromoCodePromoCode;
      'api::reservation.reservation': ApiReservationReservation;
      'api::service-package.service-package': ApiServicePackageServicePackage;
      'api::service-page.service-page': ApiServicePageServicePage;
      'api::site-content.site-content': ApiSiteContentSiteContent;
      'api::tatoueur.tatoueur': ApiTatoueurTatoueur;
      'api::tattoo-message.tattoo-message': ApiTattooMessageTattooMessage;
      'api::testimonial.testimonial': ApiTestimonialTestimonial;
      'api::user-role.user-role': ApiUserRoleUserRole;
      'api::withdrawal-request.withdrawal-request': ApiWithdrawalRequestWithdrawalRequest;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
