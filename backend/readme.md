# lms Backend
  Application setup
Create a virtualenv:

python3 -m venv hillary

Activate the virtualenv:

source  hillary/bin/activate

Install dependencies:

pip install -r requirements.txt

Run database migrations:

flask db upgrade

Running the app
In the backend directory, run this command:

flask run
