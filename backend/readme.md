## lms Backend
  # Application setup
Create a virtualenv:

```sh
python3 -m venv venv
```

Activate the virtualenv:

```sh
source  venv/bin/activate
``` 

Setting up dependencies:

```sh
pip install -r requirements.txt
```
Run database migrations:

```sh
flask db upgrade
```

Running the app
In the backend directory, run this command:

```sh
flask run
```

![docs](//frontend tests.png)