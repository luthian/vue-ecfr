# eCFR Agency Brower in Vue 2 and Vuetify

This project allows one to explore corrections to the [Electronic Code of Federation Regulations](https://www.ecfr.gov/). The site lists all the Federal Agencies and subagencies and will show which have correctoins in the eCFR system. It will also show the correction and the date it was made as well as the date the oringal error occured.

The list of Agencies can be filtered by first letter of the `sortable_name` using letters of the alphabet. To see corrections for an Agency, click the triangle next to the sentence with the count. To see subagencies, click the triangle next to the folder icon.

Note that not all corrections are properly tagged with titles and chapters so they cannot be asssociated with a specfic agency.

# Tech stack
This project uses [Vue 2](https://v2.vuejs.org/) with [Vuetify](https://v2.vuetifyjs.com/en/) to build the UI. There is no back-end; all data is pulled from the `eCFR` [API](https://www.ecfr.gov/developers/documentation/api/v1#/) and sorted and manipulated on the front-end. It uses [Vite](https://vite.dev/) for building, serving the developer environment and packaging for building.

# Credit
This repo was forked from [Simon Bernard's ](https://github.com/sbernard31/vuetify2-vite-template) which is a template for a Vue 2/Vuetify 2 project using `Vite`


