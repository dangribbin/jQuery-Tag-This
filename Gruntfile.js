module.exports = function(grunt){
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server:{
                options:{
                    port: 5000,
                    base: '.'
                }
            }
        },
        watch: {
            scripts: {
                files: ['src/*'],
                tasks: ['move', 'compress-css','compress-js'],
                options: {
                    nospawn: true,
                },
            }
        },
        uglify: {
            options:{
                preserveComments : 'some'
            },
            my_target: {
                files: {
                    'dist/jquery.tagthis.min.js': ['src/jquery.tagthis.js']
                }
            }
        },
        copy: {
            main: {
                cwd: 'src/',
                src: '**',
                dest: 'dist/',
                flatten: true,
                expand: true
            }
        },
        cssmin: {
            minify: {
                expand: true,
                cwd: 'src/',
                src: '*.css',
                dest: 'dist/',
                ext: '.min.css'
            }
        }
    });

    //load plugins
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-cssmin');

    //tasks
    grunt.registerTask('default',['connect', 'watch']);
    grunt.registerTask('move','copy');
    grunt.registerTask('compress-css','cssmin');
    grunt.registerTask('compress-js', 'uglify');

};



