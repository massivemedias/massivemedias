import type { Schema, Struct } from '@strapi/strapi';

export interface AboutEquipmentItem extends Struct.ComponentSchema {
  collectionName: 'components_about_equipment_items';
  info: {
    description: 'Equipment item for About page';
    displayName: 'Equipment Item';
    icon: 'wrench';
  };
  attributes: {
    descEn: Schema.Attribute.String & Schema.Attribute.Required;
    descFr: Schema.Attribute.String & Schema.Attribute.Required;
    iconName: Schema.Attribute.String;
    nameEn: Schema.Attribute.String & Schema.Attribute.Required;
    nameFr: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutTeamMember extends Struct.ComponentSchema {
  collectionName: 'components_about_team_members';
  info: {
    description: 'Team member profile';
    displayName: 'Team Member';
    icon: 'user';
  };
  attributes: {
    bio2En: Schema.Attribute.Text;
    bio2Fr: Schema.Attribute.Text;
    bioEn: Schema.Attribute.Text & Schema.Attribute.Required;
    bioFr: Schema.Attribute.Text & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    photo: Schema.Attribute.Media<'images'>;
    roleEn: Schema.Attribute.String & Schema.Attribute.Required;
    roleFr: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutTimelineEvent extends Struct.ComponentSchema {
  collectionName: 'components_about_timeline_events';
  info: {
    description: 'Timeline event for the About page';
    displayName: 'Timeline Event';
    icon: 'clock';
  };
  attributes: {
    eventEn: Schema.Attribute.Text & Schema.Attribute.Required;
    eventFr: Schema.Attribute.Text & Schema.Attribute.Required;
    year: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface AboutUniverseProject extends Struct.ComponentSchema {
  collectionName: 'components_about_universe_projects';
  info: {
    description: 'Associated project in the Massive universe';
    displayName: 'Universe Project';
    icon: 'globe';
  };
  attributes: {
    descriptionEn: Schema.Attribute.Text & Schema.Attribute.Required;
    descriptionFr: Schema.Attribute.Text & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    titleEn: Schema.Attribute.String & Schema.Attribute.Required;
    titleFr: Schema.Attribute.String & Schema.Attribute.Required;
    url: Schema.Attribute.String;
  };
}

export interface FooterSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_footer_social_links';
  info: {
    description: 'Social media link';
    displayName: 'Social Link';
    icon: 'link';
  };
  attributes: {
    label: Schema.Attribute.String;
    platform: Schema.Attribute.Enumeration<
      [
        'instagram',
        'facebook',
        'whatsapp',
        'twitter',
        'youtube',
        'tiktok',
        'linkedin',
      ]
    > &
      Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomeAdvantage extends Struct.ComponentSchema {
  collectionName: 'components_home_advantages';
  info: {
    description: 'Homepage advantage/benefit item';
    displayName: 'Advantage';
    icon: 'check';
  };
  attributes: {
    descriptionEn: Schema.Attribute.Text & Schema.Attribute.Required;
    descriptionFr: Schema.Attribute.Text & Schema.Attribute.Required;
    iconName: Schema.Attribute.String & Schema.Attribute.Required;
    titleEn: Schema.Attribute.String & Schema.Attribute.Required;
    titleFr: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomeFeaturedProject extends Struct.ComponentSchema {
  collectionName: 'components_home_featured_projects';
  info: {
    description: 'Homepage featured project gallery item';
    displayName: 'Featured Project';
    icon: 'picture';
  };
  attributes: {
    categoryEn: Schema.Attribute.String & Schema.Attribute.Required;
    categoryFr: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
    link: Schema.Attribute.String & Schema.Attribute.Required;
    titleEn: Schema.Attribute.String & Schema.Attribute.Required;
    titleFr: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomeServiceCard extends Struct.ComponentSchema {
  collectionName: 'components_home_service_cards';
  info: {
    description: 'Homepage service card with bilingual text';
    displayName: 'Service Card';
    icon: 'layout';
  };
  attributes: {
    descriptionEn: Schema.Attribute.Text & Schema.Attribute.Required;
    descriptionFr: Schema.Attribute.Text & Schema.Attribute.Required;
    iconName: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    link: Schema.Attribute.String & Schema.Attribute.Required;
    titleEn: Schema.Attribute.String & Schema.Attribute.Required;
    titleFr: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomeStatItem extends Struct.ComponentSchema {
  collectionName: 'components_home_stat_items';
  info: {
    description: 'Homepage stat counter item';
    displayName: 'Stat Item';
    icon: 'chartBubble';
  };
  attributes: {
    isCounter: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    labelEn: Schema.Attribute.String & Schema.Attribute.Required;
    labelFr: Schema.Attribute.String & Schema.Attribute.Required;
    suffix: Schema.Attribute.String & Schema.Attribute.DefaultTo<''>;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomeTestimonial extends Struct.ComponentSchema {
  collectionName: 'components_home_testimonials';
  info: {
    description: 'Client testimonial';
    displayName: 'Testimonial';
    icon: 'quote';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    roleEn: Schema.Attribute.String & Schema.Attribute.Required;
    roleFr: Schema.Attribute.String & Schema.Attribute.Required;
    textEn: Schema.Attribute.Text & Schema.Attribute.Required;
    textFr: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface SharedSeoMeta extends Struct.ComponentSchema {
  collectionName: 'components_shared_seo_metas';
  info: {
    description: 'SEO title and description bilingual';
    displayName: 'SEO Meta';
    icon: 'search';
  };
  attributes: {
    descriptionEn: Schema.Attribute.Text & Schema.Attribute.Required;
    descriptionFr: Schema.Attribute.Text & Schema.Attribute.Required;
    titleEn: Schema.Attribute.String & Schema.Attribute.Required;
    titleFr: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'about.equipment-item': AboutEquipmentItem;
      'about.team-member': AboutTeamMember;
      'about.timeline-event': AboutTimelineEvent;
      'about.universe-project': AboutUniverseProject;
      'footer.social-link': FooterSocialLink;
      'home.advantage': HomeAdvantage;
      'home.featured-project': HomeFeaturedProject;
      'home.service-card': HomeServiceCard;
      'home.stat-item': HomeStatItem;
      'home.testimonial': HomeTestimonial;
      'shared.seo-meta': SharedSeoMeta;
    }
  }
}
