import {
  throwError as observableThrowError,
  interval as observableInterval,
  Observable,
} from 'rxjs';

import { switchMap, startWith, map, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { AppService } from '../shared/services/app.service';
import { WeatherService } from '../weather/weather.service';
import { HelperService } from '../shared/services/helper.service';
import { WeatherIconsService } from '../shared/services/weather-icons/weather-icons.service';
import { Forecast } from './forecast';

import { apiConfig } from '../config';

@Injectable()
export class ForecastService {
  private forecastUpdateInterval = apiConfig.updateInterval.forecast;
  private unitSystem: string;

  constructor(
    private http: HttpClient,
    private appService: AppService,
    private weatherService: WeatherService,
    private weatherIconsService: WeatherIconsService,
    private helperService: HelperService
  ) {
    this.unitSystem = appService.getUnitSystem();
  }

  getForecastByCity(city: string): Observable<any> {
    return observableInterval(this.forecastUpdateInterval).pipe(
      startWith(0),
      switchMap(() =>
        this.http
          .get(
            `${apiConfig.host}/forecast/daily?q=${city}&appid=${apiConfig.appId}&units=${this.unitSystem}&cnt=${apiConfig.amountForecastDays}`
          )
          .pipe(
            // map((data) => data.li),
            catchError(this.handleError)
          )
      )
    );
  }

  handleResponseForecastData(responseData: any): Forecast {
    const { dt, temp, weather } = responseData;
    const currentWeatherTimestamp = this.weatherService.getCurrentWeatherTimestamp();

    const currentDay = this.helperService.isItCurrentDayByTimestamps(
      dt,
      currentWeatherTimestamp
    );
    const date = dt * 1000;
    const iconClassname = this.weatherIconsService.getIconClassNameByCode(
      weather[0].id
    );
    const temperatureDay = Math.round(temp.day);
    const temperatureNight = Math.round(temp.night);

    return new Forecast(
      currentDay,
      date,
      iconClassname,
      temperatureDay,
      temperatureNight,
      weather[0].description
    );
  }

  private handleError(error: any): Observable<any> {
    console.error('Error', error);
    return observableThrowError(error.message || error);
  }
}
