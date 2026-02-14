pipeline {
  agent any
  stages {
    stage('Checkout the Code/Github') {
      steps {
        git(url: 'https://github.com/BasaltHQ/crm-official', branch: 'main')
      }
    }

    stage('Node Check') {
      steps {
        nodejs('NodeJS-18') {
          sh 'npm -v'
        }

      }
    }

    stage('Checkout Configs') {
      steps {
        git(url: 'https://github.com/mmfmilton/basaltcrm-configs.git', branch: 'main', credentialsId: 'mmfmilton')
      }
    }

    stage('copy ENV files') {
      steps {
        sh 'ls  -lah'
        sh '''sh \'cd basaltcrm-configs/fairis\'
sh \'cp .env ../../\'
sh \'cp .env.local ../../\'
sh \'cd ../../\'
sh \'ls -lah\''''
      }
    }

  }
}