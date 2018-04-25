<h2 align="center" font-weight=" bold">Kullanıcı Bilgileri</h2><br>
              <table align="center"  border="1" >
                <tr>
                  <th bgcolor="#B0E0E6">Adı Soyadı:</th>
                  <td><?=$veri[0]->adiSoyadi?></td>
                </tr>
                <tr>
                  <th bgcolor="#B0E0E6">Email Adresi:</th>
                  <td><?=$veri[0]->email?></td>
                </tr>
				<tr>
                  <th bgcolor="#B0E0E6">Yetkisi:</th>
                  <td><?=$veri[0]->yetki?></td>
                </tr>
				<tr>
                  <th bgcolor="#B0E0E6">Durumu:</th>
                  <td><?=$veri[0]->durum?></td>
                </tr>
				<tr>
                  <th bgcolor="#B0E0E6">Resim:</th>
                  <td><?php	
					if($veri[0]->resim!=NULL)
					{?>
					<img height="100" src="<?=base_url()?>uploads/<?=$veri[0]->resim?>">
					<?php
					}
					?></td>
                </tr>
              </table>
          