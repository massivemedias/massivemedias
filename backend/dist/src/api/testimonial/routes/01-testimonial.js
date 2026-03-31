"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'GET',
            path: '/testimonials/public',
            handler: 'testimonial.publicList',
            config: {
                auth: false,
            },
        },
        {
            method: 'GET',
            path: '/testimonials/admin',
            handler: 'testimonial.adminList',
            config: {
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/testimonials/submit',
            handler: 'testimonial.submit',
            config: {
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/testimonials/generate-link',
            handler: 'testimonial.generateLink',
            config: {
                auth: false,
            },
        },
        {
            method: 'PUT',
            path: '/testimonials/:documentId/approve',
            handler: 'testimonial.approve',
            config: {
                auth: false,
            },
        },
        {
            method: 'DELETE',
            path: '/testimonials/:documentId',
            handler: 'testimonial.deleteTestimonial',
            config: {
                auth: false,
            },
        },
    ],
};
