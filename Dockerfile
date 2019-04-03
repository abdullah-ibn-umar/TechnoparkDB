FROM ubuntu:18.04
MAINTAINER Tulforov Jahongir

ENV PGVER 10
ENV PORT 5000
EXPOSE $PORT

RUN apt-get update
RUN apt-get install -y postgresql-$PGVER
RUN apt-get install -y curl gnupg2
RUN curl -sL https://deb.nodesource.com/setup_11.x | bash
RUN apt-get install -y nodejs

COPY ./ /opt/technopark-db/

USER postgres

RUN service postgresql start &&\
    psql --command "CREATE USER jahongir WITH SUPERUSER PASSWORD 'Password1234';" &&\
    createdb -O forum jahongir &&\
    psql < /opt/techonaprk-db/forum.sql &&\
    service postgresql stop

COPY config/pg_hba.conf /etc/postgresql/$PGVER/main/pg_hba.conf
COPY config/postgresql.conf /etc/postgresql/$PGVER/main/postgresql.conf

VOLUME  ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]

USER root
WORKDIR /opt/technopark-db
RUN npm install

CMD service postgresql start && npm run dev
